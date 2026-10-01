import { describe, it, expect } from 'vitest';
import { runNestingEngine } from './nestingEngine';
import { NestingPieceInput, NestingOptions } from './types';

// Helper para crear piezas sintéticas con dimensiones textiles realistas
function createTestPiece(
  id: string,
  orderItemId: string,
  playerName: string,
  sizeName: string,
  pieceType: string,
  width: number,
  height: number,
  allowedRotations: number[] = [0]
): NestingPieceInput {
  return {
    id,
    orderItemId,
    pieceId: `piece_${pieceType.toLowerCase()}`,
    playerName,
    playerNumber: '10',
    sizeName,
    pieceType,
    bbox: { width, height },
    areaMm2: width * height * 0.82, // ~82% de relleno poligonal típico de molde
    allowedRotations,
    cutPolygon: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ],
  };
}

describe('Motor de Nesting 2D (Strip Packing) - Fase A', () => {
  const defaultOptions: NestingOptions = {
    printableWidthMm: 1120.0,
    spacingMm: 7.0,
    groupingMode: 'MAX_SAVINGS',
  };

  it('Contención estricta: ninguna pieza excede el ancho útil del rollo (1120 mm)', () => {
    const pieces: NestingPieceInput[] = [
      createTestPiece('p1', 'j1', 'MATEO', '28', 'DELANTERO', 520, 710),
      createTestPiece('p2', 'j1', 'MATEO', '28', 'ESPALDA', 530, 720),
      createTestPiece('p3', 'j1', 'MATEO', '28', 'MANGA_IZQ', 400, 240, [0, 180]),
      createTestPiece('p4', 'j1', 'MATEO', '28', 'MANGA_DER', 400, 240, [0, 180]),
      createTestPiece('p5', 'j2', 'CARLOS', '32', 'DELANTERO', 560, 750),
      createTestPiece('p6', 'j2', 'CARLOS', '32', 'ESPALDA', 570, 760),
    ];

    const result = runNestingEngine(pieces, defaultOptions);

    expect(result.placedPieces.length).toBe(6);
    expect(result.totalRollLengthMm).toBeGreaterThan(0);

    for (const piece of result.placedPieces) {
      // Verificación estricta en milímetros
      expect(piece.xMm).toBeGreaterThanOrEqual(0);
      expect(piece.xMm + piece.effectiveWidthMm).toBeLessThanOrEqual(defaultOptions.printableWidthMm);
      expect(piece.yMm).toBeGreaterThanOrEqual(0);
    }
  });

  it('Margen de seguridad y no-solapamiento: respeta la distancia mínima de 7.0 mm entre cajas', () => {
    const pieces: NestingPieceInput[] = [
      createTestPiece('p1', 'j1', 'A', '28', 'DELANTERO', 500, 700),
      createTestPiece('p2', 'j1', 'A', '28', 'ESPALDA', 500, 700),
      createTestPiece('p3', 'j2', 'B', '28', 'DELANTERO', 450, 650),
      createTestPiece('p4', 'j2', 'B', '28', 'ESPALDA', 450, 650),
      createTestPiece('p5', 'j3', 'C', '30', 'SHORT', 480, 520),
    ];

    const spacing = 7.0;
    const result = runNestingEngine(pieces, { ...defaultOptions, spacingMm: spacing });

    const placed = result.placedPieces;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];

        // Comprobación de no colisión con margen de seguridad
        const separatedX = a.xMm + a.effectiveWidthMm + spacing <= b.xMm || b.xMm + b.effectiveWidthMm + spacing <= a.xMm;
        const separatedY = a.yMm + a.effectiveHeightMm + spacing <= b.yMm || b.yMm + b.effectiveHeightMm + spacing <= a.yMm;

        const isNonOverlapping = separatedX || separatedY;
        expect(isNonOverlapping).toBe(true);
      }
    }
  });

  it('Invarianza de piezas bloqueadas (isLocked): respeta posición fija y empaqueta el resto alrededor', () => {
    // Pieza 1 bloqueada manualmente por el usuario en posición (150 mm, 200 mm)
    const lockedPiece: NestingPieceInput = {
      ...createTestPiece('locked_1', 'j1', 'BLOQUEADO', '30', 'DELANTERO', 480, 680),
      isLocked: true,
      xMm: 150.0,
      yMm: 200.0,
      rotationDeg: 0,
    };

    const freePieces: NestingPieceInput[] = [
      createTestPiece('free_1', 'j2', 'LIBRE_1', '28', 'DELANTERO', 400, 600),
      createTestPiece('free_2', 'j2', 'LIBRE_2', '28', 'ESPALDA', 400, 600),
      createTestPiece('free_3', 'j3', 'LIBRE_3', '28', 'MANGA', 350, 220),
    ];

    const result = runNestingEngine([lockedPiece, ...freePieces], defaultOptions);

    // La pieza bloqueada debe permanecer EXACTAMENTE en sus coordenadas originales
    const foundLocked = result.placedPieces.find((p) => p.id === 'locked_1');
    expect(foundLocked).toBeDefined();
    expect(foundLocked?.xMm).toBe(150.0);
    expect(foundLocked?.yMm).toBe(200.0);
    expect(foundLocked?.isLocked).toBe(true);

    // Ninguna pieza libre debe colisionar con la pieza bloqueada
    const spacing = defaultOptions.spacingMm;
    for (const pl of result.placedPieces) {
      if (pl.id === 'locked_1') continue;

      const separatedX = foundLocked!.xMm + foundLocked!.effectiveWidthMm + spacing <= pl.xMm ||
                         pl.xMm + pl.effectiveWidthMm + spacing <= foundLocked!.xMm;
      const separatedY = foundLocked!.yMm + foundLocked!.effectiveHeightMm + spacing <= pl.yMm ||
                         pl.yMm + pl.effectiveHeightMm + spacing <= foundLocked!.yMm;

      expect(separatedX || separatedY).toBe(true);
    }
  });

  it('Modo de agrupamiento POR TALLA: agrupa ordenadamente por talla a lo largo del rollo', () => {
    const pieces: NestingPieceInput[] = [
      createTestPiece('p_t32_1', 'j1', 'JUAN', '32', 'DELANTERO', 500, 700),
      createTestPiece('p_t28_1', 'j2', 'PEDRO', '28', 'DELANTERO', 450, 650),
      createTestPiece('p_t32_2', 'j1', 'JUAN', '32', 'ESPALDA', 500, 700),
      createTestPiece('p_t28_2', 'j2', 'PEDRO', '28', 'ESPALDA', 450, 650),
    ];

    const result = runNestingEngine(pieces, {
      ...defaultOptions,
      groupingMode: 'BY_SIZE',
    });

    const t28Pieces = result.placedPieces.filter((p) => p.sizeName === '28');
    const t32Pieces = result.placedPieces.filter((p) => p.sizeName === '32');

    // En orden estándar, la talla 28 debe aparecer antes (o en un nivel Y inferior) que la 32
    const maxT28_Y = Math.max(...t28Pieces.map((p) => p.yMm));
    const minT32_Y = Math.min(...t32Pieces.map((p) => p.yMm));

    expect(minT32_Y).toBeGreaterThanOrEqual(maxT28_Y);
  });

  it('Rendimiento y métricas: entalla 16 piezas en menos de 100 ms con métricas válidas', () => {
    const pieces: NestingPieceInput[] = [];
    for (let i = 1; i <= 4; i++) {
      pieces.push(createTestPiece(`p_${i}_f`, `j${i}`, `JUGADOR_${i}`, 'M', 'DELANTERO', 500, 700));
      pieces.push(createTestPiece(`p_${i}_e`, `j${i}`, `JUGADOR_${i}`, 'M', 'ESPALDA', 500, 700));
      pieces.push(createTestPiece(`p_${i}_m1`, `j${i}`, `JUGADOR_${i}`, 'M', 'MANGA_I', 380, 230, [0, 180]));
      pieces.push(createTestPiece(`p_${i}_m2`, `j${i}`, `JUGADOR_${i}`, 'M', 'MANGA_D', 380, 230, [0, 180]));
    }

    const result = runNestingEngine(pieces, defaultOptions);

    expect(result.placedPieces.length).toBe(16);
    expect(result.executionTimeMs).toBeLessThan(100); // Ultrarrápido para interactividad en vivo
    expect(result.utilizationPercent).toBeGreaterThan(50); // Buen aprovechamiento de área
    expect(result.wastePercent).toBeGreaterThanOrEqual(0);
    expect(result.wastePercent).toBeLessThan(50);
  });
});
