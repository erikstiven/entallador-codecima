import { describe, it, expect } from 'vitest';
import { performModularNesting } from './modularNestingEngine';
import { NestingPieceInput } from './types';

function createMockPiece(
  id: string,
  orderItemId: string,
  playerName: string,
  pieceType: string,
  width: number,
  height: number
): NestingPieceInput {
  return {
    id,
    orderItemId,
    pieceId: `base_${pieceType}`,
    playerName,
    playerNumber: '10',
    sizeName: '28',
    pieceType,
    bbox: { width, height },
    areaMm2: width * height * 0.8,
    allowedRotations: [0],
    cutPolygon: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  };
}

describe('modularNestingEngine', () => {
  it('debe estructurar camisetas por jugador en la misma fila (Frente + Espalda + Mangas)', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'FELIPITO', 'DELANTERO', 360, 480),
      createMockPiece('p1_esp', 'player_1', 'FELIPITO', 'ESPALDA', 360, 480),
      createMockPiece('p1_m1', 'player_1', 'FELIPITO', 'MANGA_IZQ', 300, 160),
      createMockPiece('p1_m2', 'player_1', 'FELIPITO', 'MANGA_DER', 300, 160),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
    });

    expect(result.placedPieces.length).toBe(4);
    expect(result.sheets).toBeDefined();
    expect(result.sheets!.length).toBe(1);
    expect(result.sheets![0].garmentType).toBe('CAMISETA');

    // Delantero en X=3 (sideMargin), Espalda al lado, Mangas a la derecha
    const del = result.placedPieces.find((p) => p.pieceType === 'DELANTERO')!;
    const esp = result.placedPieces.find((p) => p.pieceType === 'ESPALDA')!;
    const m1 = result.placedPieces.find((p) => p.pieceType === 'MANGA_IZQ')!;
    const m2 = result.placedPieces.find((p) => p.pieceType === 'MANGA_DER')!;

    expect(del.xMm).toBe(3);
    expect(esp.xMm).toBeGreaterThan(del.xMm + del.effectiveWidthMm);
    expect(m1.xMm).toBeGreaterThan(esp.xMm + esp.effectiveWidthMm);
    expect(m2.xMm).toBeGreaterThan(esp.xMm + esp.effectiveWidthMm);
  });

  it('debe estructurar shorts en pares lado a lado en un pliego independiente', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_s1', 'player_1', 'FELIPITO', 'PANTALONETA_IZQ', 500, 450),
      createMockPiece('p1_s2', 'player_1', 'FELIPITO', 'PANTALONETA_DER', 500, 450),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
    });

    expect(result.sheets).toBeDefined();
    expect(result.sheets!.length).toBe(1);
    expect(result.sheets![0].garmentType).toBe('SHORT');

    const s1 = result.placedPieces.find((p) => p.pieceType === 'PANTALONETA_IZQ')!;
    const s2 = result.placedPieces.find((p) => p.pieceType === 'PANTALONETA_DER')!;

    expect(s1.xMm).toBe(3);
    expect(s2.xMm).toBeGreaterThanOrEqual(503);
  });

  it('debe particionar en múltiples pliegos si la altura acumulada supera maxSheetLengthMm (500 cm)', () => {
    const pieces: NestingPieceInput[] = [];
    for (let i = 1; i <= 12; i++) {
      pieces.push(
        createMockPiece(`p${i}_del`, `player_${i}`, `JUGADOR_${i}`, 'DELANTERO', 360, 500),
        createMockPiece(`p${i}_esp`, `player_${i}`, `JUGADOR_${i}`, 'ESPALDA', 360, 500),
        createMockPiece(`p${i}_m1`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_IZQ', 300, 180),
        createMockPiece(`p${i}_m2`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_DER', 300, 180)
      );
    }

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 3000, // 3 metros máx para forzar particionado
    });

    expect(result.sheets).toBeDefined();
    expect(result.sheets!.length).toBeGreaterThan(1);
    for (const sheet of result.sheets!) {
      expect(sheet.heightMm).toBeLessThanOrEqual(3000 + 50);
    }
  });

  it('debe rotar las mangas 90° en la columna derecha para aprovechar el espacio vertical si el ancho es reducido', () => {
    // Delantero 400x700, Espalda 400x700 -> Ancho ocupado = 3 + 400 + 3 + 400 = 806 mm.
    // Espacio restante en 1120 mm = 1120 - 806 - 3 - 3 = 308 mm.
    // Mangas 340x180: rotadas 90° caben (180 <= 308).
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'MARCELO', 'DELANTERO', 400, 700),
      createMockPiece('p1_esp', 'player_1', 'MARCELO', 'ESPALDA', 400, 700),
      createMockPiece('p1_m1', 'player_1', 'MARCELO', 'MANGA_IZQ', 340, 180),
      createMockPiece('p1_m2', 'player_1', 'MARCELO', 'MANGA_DER', 340, 180),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
    });

    const m1 = result.placedPieces.find((p) => p.pieceType === 'MANGA_IZQ')!;
    const m2 = result.placedPieces.find((p) => p.pieceType === 'MANGA_DER')!;

    expect(m1.rotationDeg).toBe(90);
    expect(m2.rotationDeg).toBe(90);
    expect(m1.effectiveWidthMm).toBe(180);
    expect(m1.effectiveHeightMm).toBe(340);
    expect(m1.xMm).toBeGreaterThanOrEqual(800);
    // Altura total del pliego es ultra-compacta (~700mm)
    expect(result.sheets![0].heightMm).toBeLessThan(750);
  });
});
