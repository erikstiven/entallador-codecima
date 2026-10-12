import { describe, it, expect, beforeEach } from 'vitest';
import { useNestingStore } from './nestingStore';
import { NestingPieceInput } from './types';
import { pieceSvgRegistry } from '@/modules/generator/garmentGenerator';

function createMockNestingPiece(
  id: string,
  playerName: string,
  pieceType: string,
  width: number,
  height: number,
  svgContent?: string
): NestingPieceInput {
  return {
    id,
    orderItemId: `item_${playerName}`,
    pieceId: `piece_${pieceType}`,
    playerName,
    playerNumber: '10',
    sizeName: 'M',
    pieceType,
    bbox: { width, height },
    areaMm2: width * height,
    allowedRotations: [0],
    cutPolygon: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    svgContent,
  };
}

describe('useNestingStore (Optimización de Memoria y Deduplicación)', () => {
  beforeEach(() => {
    useNestingStore.getState().clearNesting();
    pieceSvgRegistry.clear();
  });

  it('elimina la duplicación masiva de svgContent y comparte referencias en estado', async () => {
    const hugeSvgString = '<svg width="400" height="600"><rect fill="orange" /></svg>'.repeat(50);
    const mockPieces: NestingPieceInput[] = [
      createMockNestingPiece('p1', 'JUAN', 'DELANTERO', 400, 600, hugeSvgString),
      createMockNestingPiece('p2', 'JUAN', 'ESPALDA', 400, 600, hugeSvgString),
    ];

    const result = await useNestingStore.getState().runNesting(mockPieces, {
      printableWidthMm: 1120,
    });

    const state = useNestingStore.getState();

    // 1. El SVG masivo fue transferido al registry Flyweight
    expect(pieceSvgRegistry.has('p1')).toBe(true);
    expect(pieceSvgRegistry.get('p1')).toBe(hugeSvgString);

    // 2. Las piezas en el store NO retienen la propiedad svgContent masiva
    for (const p of state.placedPieces) {
      expect(p.svgContent).toBeUndefined();
    }

    // 3. Comparten la misma referencia de array para evitar duplicación
    expect(state.placedPieces).toBe(result.placedPieces);
    expect(state.nestingResult?.placedPieces).toBe(state.placedPieces);
    expect(state.sheets).toBe(result.sheets);
    expect(state.nestingResult?.sheets).toBe(state.sheets);
  });

  it('movePiece opera sobre copias superficiales livianas y sincroniza sheets sin recrear strings', async () => {
    const mockPieces: NestingPieceInput[] = [
      createMockNestingPiece('p1', 'CARLOS', 'DELANTERO', 350, 500),
      createMockNestingPiece('p2', 'CARLOS', 'ESPALDA', 350, 500),
    ];

    await useNestingStore.getState().runNesting(mockPieces, { printableWidthMm: 1120 });

    const beforeMove = useNestingStore.getState().placedPieces;
    const p2Before = beforeMove.find((p) => p.id === 'p2');

    // Mover pieza p1
    useNestingStore.getState().movePiece('p1', 760, 200);

    const afterMove = useNestingStore.getState().placedPieces;
    const p1After = afterMove.find((p) => p.id === 'p1');
    const p2After = afterMove.find((p) => p.id === 'p2');

    expect(p1After?.xMm).toBe(760);
    expect(p1After?.yMm).toBe(200);
    expect(p1After?.isLocked).toBe(true);

    // La pieza no modificada (p2) conserva su identidad de referencia
    expect(p2After).toBe(p2Before);

    // Las hojas (sheets) se sincronizan con la pieza actualizada
    const sheet = useNestingStore.getState().sheets[0];
    const sheetPiece1 = sheet.placedPieces.find((p) => p.id === 'p1');
    expect(sheetPiece1?.xMm).toBe(760);
    expect(sheetPiece1?.yMm).toBe(200);

    // nestingResult conserva la misma lista actualizada
    expect(useNestingStore.getState().nestingResult?.placedPieces).toBe(afterMove);
  });

  it('rotatePiece y toggleLockPiece actualizan metadatos por referencia', async () => {
    const mockPieces: NestingPieceInput[] = [
      createMockNestingPiece('p1', 'MATEO', 'MANGA_IZQ', 200, 300),
    ];

    await useNestingStore.getState().runNesting(mockPieces, { printableWidthMm: 1120 });

    const rotationBefore = useNestingStore.getState().placedPieces[0].rotationDeg;
    useNestingStore.getState().rotatePiece('p1', 90);
    let piece = useNestingStore.getState().placedPieces[0];
    expect(piece.rotationDeg).toBe((rotationBefore + 90) % 360);
    const isOrthogonal = piece.rotationDeg === 90 || piece.rotationDeg === 270;
    expect(piece.effectiveWidthMm).toBe(isOrthogonal ? 300 : 200);
    expect(piece.effectiveHeightMm).toBe(isOrthogonal ? 200 : 300);
    expect(piece.isLocked).toBe(true);

    useNestingStore.getState().toggleLockPiece('p1');
    piece = useNestingStore.getState().placedPieces[0];
    expect(piece.isLocked).toBe(false);
  });

  it('rechaza movimientos manuales que provocarían una colisión', async () => {
    const mockPieces: NestingPieceInput[] = [
      createMockNestingPiece('p1', 'CARLOS', 'DELANTERO', 350, 500),
      createMockNestingPiece('p2', 'CARLOS', 'ESPALDA', 350, 500),
    ];
    await useNestingStore.getState().runNesting(mockPieces, { printableWidthMm: 1120 });
    const original = useNestingStore.getState().placedPieces.find((piece) => piece.id === 'p1')!;

    expect(useNestingStore.getState().movePiece('p1', 120, 200)).toBe(false);
    const after = useNestingStore.getState().placedPieces.find((piece) => piece.id === 'p1')!;
    expect(after.xMm).toBe(original.xMm);
    expect(after.yMm).toBe(original.yMm);
  });
});
