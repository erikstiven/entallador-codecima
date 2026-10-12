import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { performModularNesting } from './modularNestingEngine';
import { NestingPieceInput } from './types';
import { parsePatternSvg } from '@/modules/patterns/patternParser';

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

  it('debe acomodar las mangas excedentes en la zona lateral continua reduciendo el largo total del pliego', () => {
    // 2 jugadores: Delantero (500x700), Espalda (500x700), 2 Mangas c/u (480x240) en bobina de 1280 mm
    // rightBandX = 3 + 500 + 3 + 500 + 3 = 1009 mm
    // En bobina 1280 mm, el ancho lateral disponible es 1280 - 1009 - 3 = 268 mm.
    // Una manga rotada mide 240 mm <= 268 mm, por lo que las mangas fluyen continuas tête-bêche en la columna derecha.
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
    const sleeves = result.placedPieces.filter((p) => p.pieceType.startsWith('MANGA'));
    expect(sleeves.length).toBe(4);

    // Todas las 4 mangas se colocan en la banda lateral derecha continuas tête-bêche
    const rightColSleeves = sleeves.filter((s) => s.xMm >= rightBandX - 10);
    expect(rightColSleeves.length).toBe(4);
  });

  it('debe apilar mangas tête-bêche continuas en la columna lateral para 1120 mm', () => {
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

    // Todas las 6 mangas caben en la columna lateral derecha (X >= 800) tête-bêche continuas
    const rightSideSleeves = result.placedPieces
      .filter((p) => p.pieceType.startsWith('MANGA') && p.xMm >= 800)
      .sort((a, b) => a.yMm - b.yMm);

    expect(rightSideSleeves.length).toBe(6);

    // Verificar que cada manga lateral está pegada a la espalda (X = 809mm) sin hueco muerto horizontal
    for (const sleeve of rightSideSleeves) {
      expect(sleeve.xMm).toBeCloseTo(809, 0);
    }
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

  it('debe estructurar mangas continuas en doble columna sin huecos muertos verticales entre filas (Caso Imagen 4)', () => {
    // 6 jugadores infantiles/juveniles (ancho delantero 360, espalda 360, mangas 280x140)
    // En bobina 1120 mm: 3 + 360 + 3 + 360 + 3 = 729 mm ocupados por camisetas.
    // Espacio libre lateral: 1120 - 729 - 3 = 388 mm.
    // 2 mangas rotadas: 140 + 3 + 140 = 283 mm <= 388 mm -> Doble columna activa.
    const playerNames = ['MATEO', 'CAMILA', 'CARLOS', 'DANIELA', 'ALVARO', 'VALENTINA'];
    const pieces: NestingPieceInput[] = [];

    for (let i = 0; i < playerNames.length; i++) {
      const p = playerNames[i];
      pieces.push(
        createMockPiece(`p${i}_del`, `item_${i}`, p, 'DELANTERO', 360, 520),
        createMockPiece(`p${i}_esp`, `item_${i}`, p, 'ESPALDA', 360, 520),
        createMockPiece(`p${i}_m1`, `item_${i}`, p, 'MANGA_IZQ', 280, 140),
        createMockPiece(`p${i}_m2`, `item_${i}`, p, 'MANGA_DER', 280, 140)
      );
    }

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });

    expect(result.sheets).toBeDefined();
    expect(result.sheets!.length).toBe(1);

    // Todas las mangas izquierdas en Columna 1
    const col1Sleeves = result.placedPieces
      .filter((p) => p.pieceType === 'MANGA_IZQ')
      .sort((a, b) => a.yMm - b.yMm);

    // Todas las mangas derechas en Columna 2
    const col2Sleeves = result.placedPieces
      .filter((p) => p.pieceType === 'MANGA_DER')
      .sort((a, b) => a.yMm - b.yMm);

    expect(col1Sleeves.length).toBe(6);
    expect(col2Sleeves.length).toBe(6);

    // Verificar que en Columna 1 cada manga se apila inmediatamente debajo de la anterior (sin el hueco de 270 mm)
    for (let i = 1; i < col1Sleeves.length; i++) {
      const prev = col1Sleeves[i - 1];
      const curr = col1Sleeves[i];
      const expectedY = prev.yMm + prev.effectiveHeightMm + 3;
      expect(curr.yMm).toBeCloseTo(expectedY, 1);
    }

    // Verificar que en Columna 2 cada manga se apila inmediatamente debajo de la anterior
    for (let i = 1; i < col2Sleeves.length; i++) {
      const prev = col2Sleeves[i - 1];
      const curr = col2Sleeves[i];
      const expectedY = prev.yMm + prev.effectiveHeightMm + 3;
      expect(curr.yMm).toBeCloseTo(expectedY, 1);
    }

    // Las columnas de mangas deben empezar en el margen superior (4 mm)
    expect(col1Sleeves[0].yMm).toBe(4);
    expect(col2Sleeves[0].yMm).toBe(4);
  });

  it('debe encastrar mangas tête-bêche (90° y 270°) cuando no caben dos columnas paralelas (Caso Imagen 2)', () => {
    // Cargar mangas reales del molde de fútbol oficial (talla 28)
    const svgPath = path.resolve(__dirname, '../../../tests/fixtures/patterns/moldes_futbol_2026.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const { patternSet } = parsePatternSvg(svgContent, 'FUTBOL', 'FUTBOL', 'moldes.svg');
    const t28 = patternSet.sizes.find((s: any) => s.sizeName === '28')!;
    const mIzq = t28.pieces.find((p: any) => p.pieceType === 'MANGA_IZQ')!;
    const mDer = t28.pieces.find((p: any) => p.pieceType === 'MANGA_DER')!;

    // 1 jugador con delantero 445x650 y espalda 445x650
    // En bobina 1120 mm: 3 + 445 + 3 + 445 + 3 = 899 mm ocupados.
    // Ancho libre lateral = 1120 - 899 - 3 = 218 mm.
    // Como las mangas rotadas 90° miden 212.5 mm de ancho, cabe exactamente 1 columna (212.5 <= 218).
    // Dos columnas paralelas requerirían 212.5 + 3 + 212.5 = 428 mm > 218 mm (no caben 2 columnas).
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'CAMILA', 'DELANTERO', 445, 650),
      createMockPiece('p1_esp', 'player_1', 'CAMILA', 'ESPALDA', 445, 650),
      {
        ...createMockPiece('p1_m1', 'player_1', 'CAMILA', 'MANGA_IZQ', mIzq.bbox.width, mIzq.bbox.height),
        cutPolygon: mIzq.cutPolygon,
      },
      {
        ...createMockPiece('p1_m2', 'player_1', 'CAMILA', 'MANGA_DER', mDer.bbox.width, mDer.bbox.height),
        cutPolygon: mDer.cutPolygon,
      },
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });

    const m1 = result.placedPieces.find((p) => p.pieceType === 'MANGA_IZQ')!;
    const m2 = result.placedPieces.find((p) => p.pieceType === 'MANGA_DER')!;

    expect(m1.yMm).toBeLessThan(650);
    expect(m2.yMm).toBeLessThan(650);

    // Manga 1 con puño a la izquierda (90°) y Manga 2 con puño a la derecha (270°) encastrada
    expect(m1.rotationDeg).toBe(90);
    expect(m2.rotationDeg).toBe(270);
    expect(m1.xMm).toBeGreaterThanOrEqual(890);
    expect(m2.xMm).toBeGreaterThanOrEqual(890);

    // La altura total del par encastrado debe ser menor que la suma de sus bounding boxes separadas
    const totalPairHeight = Math.max(m1.yMm + m1.effectiveHeightMm, m2.yMm + m2.effectiveHeightMm) - m1.yMm;
    const separatedHeight = m1.effectiveHeightMm + 3 + m2.effectiveHeightMm;
    expect(totalPairHeight).toBeLessThan(separatedHeight);
  });
});


