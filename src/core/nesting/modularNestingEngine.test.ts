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

  it('debe rotar las mangas con encastre intercalado (90° y 270°) en columna derecha para bobina 1120 mm', () => {
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
    expect(m2.rotationDeg).toBe(270);
    expect(m1.effectiveWidthMm).toBe(180);
    expect(m1.effectiveHeightMm).toBe(340);
    expect(m1.xMm).toBeGreaterThanOrEqual(800);
    // Altura total del pliego es ultra-compacta (~700mm)
    expect(result.sheets![0].heightMm).toBeLessThan(750);
  });

  it('debe acomodar mangas en doble columna paralela si el ancho de bobina lo permite (ej. 1600 mm)', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'MARCELO', 'DELANTERO', 400, 700),
      createMockPiece('p1_esp', 'player_1', 'MARCELO', 'ESPALDA', 400, 700),
      createMockPiece('p1_m1', 'player_1', 'MARCELO', 'MANGA_IZQ', 340, 180),
      createMockPiece('p1_m2', 'player_1', 'MARCELO', 'MANGA_DER', 340, 180),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1600,
      maxSheetLengthMm: 5000,
    });

    const m1 = result.placedPieces.find((p) => p.pieceType === 'MANGA_IZQ')!;
    const m2 = result.placedPieces.find((p) => p.pieceType === 'MANGA_DER')!;

    // En bobina ancha, m1 y m2 van lado a lado en 2 columnas
    expect(m1.rotationDeg).toBe(90);
    expect(m2.rotationDeg).toBe(90);
    expect(m2.xMm).toBeGreaterThan(m1.xMm + m1.effectiveWidthMm);
  });

  it('debe acomodar las mangas excedentes en la zona inferior bajo las columnas de camiseta (xMm < rightBandX) reduciendo el largo total del pliego', () => {
    // 2 jugadores: Delantero (500x700), Espalda (500x700), 2 Mangas c/u (480x240) en bobina de 1280 mm
    // rightBandX = 3 + 500 + 3 + 500 + 3 = 1009 mm
    // Si se apilaran las 4 mangas en la columna derecha: 4 * 480 + separaciones ≈ 1940 mm
    // Con relleno inferior inteligente: 2 mangas en columna derecha (967 mm <= jerseyBottomY 1410 mm)
    // y las 2 restantes bajo las columnas de camiseta -> largo total ~1657 mm (< 1700 mm)
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'JUGADOR_1', 'DELANTERO', 500, 700),
      createMockPiece('p1_esp', 'player_1', 'JUGADOR_1', 'ESPALDA', 500, 700),
      createMockPiece('p1_m1', 'player_1', 'JUGADOR_1', 'MANGA_IZQ', 480, 240),
      createMockPiece('p1_m2', 'player_1', 'JUGADOR_1', 'MANGA_DER', 480, 240),
      createMockPiece('p2_del', 'player_2', 'JUGADOR_2', 'DELANTERO', 500, 700),
      createMockPiece('p2_esp', 'player_2', 'JUGADOR_2', 'ESPALDA', 500, 700),
      createMockPiece('p2_m1', 'player_2', 'JUGADOR_2', 'MANGA_IZQ', 480, 240),
      createMockPiece('p2_m2', 'player_2', 'JUGADOR_2', 'MANGA_DER', 480, 240),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1280,
      maxSheetLengthMm: 5000,
    });

    const rightBandX = 3 + 500 + 3 + 500 + 3; // 1009 mm
    const stackedRightColumnHeight = 4 + 4 * 480 + 4 * 3 + 4; // 1940 mm

    const sleeves = result.placedPieces.filter((p) => p.pieceType.startsWith('MANGA'));
    expect(sleeves.length).toBe(4);

    // Las mangas que sobrepasan la altura de las camisetas se acomodan bajo las columnas de camiseta (xMm < rightBandX)
    const bottomSleeves = sleeves.filter((s) => s.xMm < rightBandX);
    expect(bottomSleeves.length).toBe(2);
    for (const s of bottomSleeves) {
      expect(s.xMm).toBeLessThan(rightBandX);
      expect(s.yMm).toBeGreaterThanOrEqual(1400);
    }

    // Ninguna manga en la columna derecha debe rebasar la altura de las camisetas (~1410 mm)
    const rightColSleeves = sleeves.filter((s) => s.xMm >= rightBandX);
    expect(rightColSleeves.length).toBe(2);
    for (const s of rightColSleeves) {
      expect(s.yMm + s.effectiveHeightMm).toBeLessThanOrEqual(1410);
    }

    // El largo total del pliego es significativamente menor que apilar las 4 mangas en la columna derecha
    expect(result.sheets![0].heightMm).toBeLessThan(stackedRightColumnHeight - 200);
    expect(result.sheets![0].heightMm).toBeLessThan(1700);
  });

  it('debe eliminar completamente los huecos blancos laterales apilando mangas en pista vertical continua desacoplada con separación exacta de 3mm', () => {
    // 3 jugadores con camisetas de 600 mm de altura y mangas de 350 mm de largo
    const pieces: NestingPieceInput[] = [];
    for (let i = 1; i <= 3; i++) {
      pieces.push(
        createMockPiece(`p${i}_del`, `player_${i}`, `JUGADOR_${i}`, 'DELANTERO', 400, 600),
        createMockPiece(`p${i}_esp`, `player_${i}`, `JUGADOR_${i}`, 'ESPALDA', 400, 600),
        createMockPiece(`p${i}_m1`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_IZQ', 350, 200),
        createMockPiece(`p${i}_m2`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_DER', 350, 200)
      );
    }

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });

    const rightTrackSleeves = result.placedPieces
      .filter((p) => p.pieceType.startsWith('MANGA') && p.xMm >= 800)
      .sort((a, b) => a.yMm - b.yMm);

    // En la pista continua deben caber 5 mangas sin huecos (la 6ta va al fondo)
    expect(rightTrackSleeves.length).toBe(5);

    // Verificar que cada manga consecutiva está separada exactamente por spacingMm (3mm),
    // eliminando por completo los antiguos huecos de 25 cm por fila
    for (let i = 0; i < rightTrackSleeves.length - 1; i++) {
      const current = rightTrackSleeves[i];
      const next = rightTrackSleeves[i + 1];
      const distanceY = next.yMm - (current.yMm + current.effectiveHeightMm);
      expect(Math.abs(distanceY - 3)).toBeLessThan(0.1);
    }

    // Manga 2 cruza limpiamente la frontera entre fila 1 y fila 2 (600mm)
    expect(rightTrackSleeves[1].yMm).toBeLessThan(600);
    expect(rightTrackSleeves[1].yMm + rightTrackSleeves[1].effectiveHeightMm).toBeGreaterThan(600);
  });

  it('debe ejecutar el acomodo modular continuo en tiempo ultrarrápido (< 50ms) para 20 jugadores', () => {
    const pieces: NestingPieceInput[] = [];
    for (let i = 1; i <= 20; i++) {
      pieces.push(
        createMockPiece(`p${i}_del`, `player_${i}`, `JUGADOR_${i}`, 'DELANTERO', 400, 650),
        createMockPiece(`p${i}_esp`, `player_${i}`, `JUGADOR_${i}`, 'ESPALDA', 400, 650),
        createMockPiece(`p${i}_m1`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_IZQ', 320, 180),
        createMockPiece(`p${i}_m2`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_DER', 320, 180)
      );
    }

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
    });

    expect(result.placedPieces.length).toBe(80);
    expect(result.executionTimeMs).toBeLessThan(50);
    expect(result.sheets!.length).toBeGreaterThan(1);
    expect(result.utilizationPercent).toBeGreaterThan(60);
  });
});


