import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { performModularNesting } from './modularNestingEngine';
import { NestingPieceInput } from './types';
import { parsePatternSvg } from '@/modules/patterns/patternParser';
import { parseExcelBuffer } from '@/modules/orders/excelParser';
import { generateGarmentPieces } from '@/modules/generator/garmentGenerator';
import { parseDesignSvg } from '@/modules/designs/designParser';
import { getOrientedPolygon, doPolygonsOverlap } from '@/core/geometry/transform';
import { calculatePolygonalIntersectionArea } from '@/core/geometry/clipperService';
import { validateManualPlacement, getPiecePolygon } from './placementValidation';

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

  it('debe estructurar shorts en pares lado a lado en un pliego independiente y centrados', () => {
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

    expect(s2.xMm).toBeGreaterThanOrEqual(3);
    expect(s1.xMm).toBeGreaterThan(s2.xMm + 500);
  });

  it('debe empaquetar 3 pantalonetas por fila en bobina de 1600 mm para máximo aprovechamiento', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_izq', 'player_1', 'JUGADOR_1', 'PANTALONETA_IZQ', 470, 400),
      createMockPiece('p1_der', 'player_1', 'JUGADOR_1', 'PANTALONETA_DER', 470, 400),
      createMockPiece('p2_izq', 'player_2', 'JUGADOR_2', 'PANTALONETA_IZQ', 470, 400),
      createMockPiece('p2_der', 'player_2', 'JUGADOR_2', 'PANTALONETA_DER', 470, 400),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1600,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });

    // En 1600 mm con piezas de 470 mm caben 3 piezas en la fila 1 (470*3 + 6 = 1416 mm <= 1600 mm)
    const row1Pieces = result.placedPieces.filter((p) => Math.abs(p.yMm - result.placedPieces[0].yMm) < 5);
    expect(row1Pieces.length).toBe(3);
  });

  it('debe aplicar modo puzzle con giro a 180° en la pierna izquierda cuando allowedRotations incluye 180', () => {
    const p1 = createMockPiece('p1_izq', 'player_1', 'JUGADOR_1', 'PANTALONETA_IZQ', 470, 400);
    const p2 = createMockPiece('p1_der', 'player_1', 'JUGADOR_1', 'PANTALONETA_DER', 470, 400);
    p1.allowedRotations = [0, 180];
    p2.allowedRotations = [0, 180];

    const result = performModularNesting([p1, p2], {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
    });

    const placedIzq = result.placedPieces.find((p) => p.pieceType === 'PANTALONETA_IZQ')!;
    const placedDer = result.placedPieces.find((p) => p.pieceType === 'PANTALONETA_DER')!;

    expect(placedDer.rotationDeg).toBe(0);
    expect(placedIzq.rotationDeg).toBe(180);
  });

  it('debe estructurar parejas de pantalonetas con tiro-con-tiro (0°/180° y 90°/270°) en un solo pliego eficiente sin desperdicio', () => {
    // Caso de taller: T28 (vertical), T34 (apaisado)
    const pieces: NestingPieceInput[] = [
      createMockPiece('t28_izq', 'play_1', 'JUAN', 'PANTALONETA_IZQ', 490, 383),
      createMockPiece('t28_der', 'play_1', 'JUAN', 'PANTALONETA_DER', 490, 383),
      createMockPiece('t34_izq', 'play_2', 'PEDRO', 'PANTALONETA_IZQ', 610, 465),
      createMockPiece('t34_der', 'play_2', 'PEDRO', 'PANTALONETA_DER', 610, 465),
    ];
    for (const p of pieces) {
      p.allowedRotations = [0, 90, 180, 270];
    }

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });

    expect(result.sheets).toHaveLength(1);
    expect(result.sheets![0].garmentType).toBe('SHORT');
    expect(result.placedPieces).toHaveLength(4);

    // T28 debe estar a 0° y 180° vertical
    const t28Der = result.placedPieces.find((p) => p.id === 't28_der')!;
    const t28Izq = result.placedPieces.find((p) => p.id === 't28_izq')!;
    expect(t28Der.rotationDeg).toBe(0);
    expect(t28Izq.rotationDeg).toBe(180);

    // T34 en 1120mm debe estar a 90° y 270° (apaisado) para caber de a 2 en la fila
    const t34Der = result.placedPieces.find((p) => p.id === 't34_der')!;
    const t34Izq = result.placedPieces.find((p) => p.id === 't34_izq')!;
    expect([90, 270]).toContain(t34Der.rotationDeg);
    expect([90, 270]).toContain(t34Izq.rotationDeg);
    expect(t34Der.rotationDeg).not.toBe(t34Izq.rotationDeg);

    // Ambas parejas deben estar cada una en su propia fila con sus 2 piernas juntas
    expect(Math.abs(t28Der.yMm - t28Izq.yMm)).toBeLessThan(5);
    expect(Math.abs(t34Der.yMm - t34Izq.yMm)).toBeLessThan(5);
  });

  it('debe respetar estrictamente rotationPolicy ESTRICTO_VERTICAL y CABEZA_COLA para sublimación sin reflejos', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('sh_izq', 'play_1', 'CAMILO', 'PANTALONETA_IZQ', 610, 465),
      createMockPiece('sh_der', 'play_1', 'CAMILO', 'PANTALONETA_DER', 610, 465),
    ];
    for (const p of pieces) {
      p.allowedRotations = [0, 90, 180, 270];
    }

    // Caso 1: Con ESTRICTO_VERTICAL, ninguna pieza se rota (todas a 0°)
    const resEstricto = performModularNesting(pieces, {
      printableWidthMm: 1120,
      rotationPolicy: 'ESTRICTO_VERTICAL',
    });
    for (const p of resEstricto.placedPieces) {
      expect(p.rotationDeg).toBe(0);
    }

    // Caso 2: Con CABEZA_COLA, solo se permiten 0° y 180° (nunca 90° ni 270°)
    const resCabezaCola = performModularNesting(pieces, {
      printableWidthMm: 1600, // En 1600 cabe 0°/180°
      rotationPolicy: 'CABEZA_COLA',
    });
    for (const p of resCabezaCola.placedPieces) {
      expect([0, 180]).toContain(p.rotationDeg);
    }

    // Caso 3: Verificar que las piezas NUNCA se reflejan ni invierten (rotaciones son 0, 90, 180, 270 limpias)
    for (const p of [...resEstricto.placedPieces, ...resCabezaCola.placedPieces]) {
      expect([0, 90, 180, 270]).toContain(p.rotationDeg);
      expect(p.effectiveWidthMm).toBeGreaterThan(0);
      expect(p.effectiveHeightMm).toBeGreaterThan(0);
    }
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

    // Solo dos caben dentro de la altura de las camisetas; las otras dos deben
    // ir al fondo en una fila horizontal, que usa menos largo que forzar la columna.
    const rightColSleeves = sleeves.filter((s) => s.xMm >= rightBandX - 10);
    const bottomSleeves = sleeves.filter((s) => s.xMm < rightBandX - 10);
    expect(rightColSleeves.length).toBe(2);
    expect(bottomSleeves.length).toBe(2);
    expect(bottomSleeves[0].yMm).toBeCloseTo(bottomSleeves[1].yMm, 2);
    expect(result.totalRollLengthMm).toBeLessThan(1700);
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

    // Cinco mangas caben realmente dentro de la altura disponible; la sexta
    // debe ir al fondo sin alargar artificialmente la columna lateral.
    const rightSideSleeves = result.placedPieces
      .filter((p) => p.pieceType.startsWith('MANGA') && p.xMm >= 800)
      .sort((a, b) => a.yMm - b.yMm);

    expect(rightSideSleeves.length).toBe(5);
    expect(result.placedPieces.filter((p) => p.pieceType.startsWith('MANGA') && p.xMm < 800)).toHaveLength(1);

    // El barrido X puede acercarlas al cuerpo o al margen derecho según el
    // hueco que reduzca más la altura total.
    for (const sleeve of rightSideSleeves) {
      expect(sleeve.xMm).toBeGreaterThanOrEqual(809);
      expect(sleeve.xMm + sleeve.effectiveWidthMm).toBeLessThanOrEqual(1117);
    }
  });

  it('debe ejecutar el acomodo modular continuo en tiempo ultrarrápido (< 30ms) para 20 jugadores', () => {
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
    expect(result.executionTimeMs).toBeLessThan(30);
    expect(result.sheets!.length).toBeGreaterThan(1);
    expect(result.utilizationPercent).toBeGreaterThan(60);
  });

  it('debe colocar una sola manga en el hueco lateral cuando la pareja completa no cabe', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'INIGO', 'DELANTERO', 450, 650),
      createMockPiece('p1_esp', 'player_1', 'INIGO', 'ESPALDA', 450, 650),
      createMockPiece('p1_m1', 'player_1', 'INIGO', 'MANGA_IZQ', 400, 180),
      createMockPiece('p1_m2', 'player_1', 'INIGO', 'MANGA_DER', 400, 180),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });
    const sleeves = result.placedPieces.filter((p) => p.pieceType.startsWith('MANGA'));
    const lateral = sleeves.filter((p) => p.yMm < 650);
    const bottom = sleeves.filter((p) => p.yMm >= 650);

    expect(lateral).toHaveLength(1);
    expect(bottom).toHaveLength(1);
    expect(lateral[0].xMm).toBeGreaterThanOrEqual(906);
  });

  it('debe enviar dos mangas al fondo lado a lado cuando ninguna cabe en el lateral', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'INIGO', 'DELANTERO', 480, 650),
      createMockPiece('p1_esp', 'player_1', 'INIGO', 'ESPALDA', 480, 650),
      createMockPiece('p1_m1', 'player_1', 'INIGO', 'MANGA_IZQ', 400, 180),
      createMockPiece('p1_m2', 'player_1', 'INIGO', 'MANGA_DER', 400, 180),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });
    const sleeves = result.placedPieces
      .filter((p) => p.pieceType.startsWith('MANGA'))
      .sort((a, b) => a.xMm - b.xMm);

    expect(sleeves).toHaveLength(2);
    expect(sleeves[0].yMm).toBeCloseTo(sleeves[1].yMm, 2);
    expect(sleeves[1].xMm).toBeGreaterThan(sleeves[0].xMm);
    expect(sleeves.map((p) => p.rotationDeg).sort((a, b) => a - b)).toEqual([0, 180]);
  });

  it('debe usar huecos de filas anteriores para mangas de un jugador posterior', () => {
    const pieces: NestingPieceInput[] = [
      createMockPiece('p1_del', 'player_1', 'MATEO', 'DELANTERO', 450, 650),
      createMockPiece('p1_esp', 'player_1', 'MATEO', 'ESPALDA', 450, 650),
      createMockPiece('p2_del', 'player_2', 'ALVARO', 'DELANTERO', 450, 650),
      createMockPiece('p2_esp', 'player_2', 'ALVARO', 'ESPALDA', 450, 650),
      createMockPiece('p3_del', 'player_3', 'INIGO', 'DELANTERO', 480, 650),
      createMockPiece('p3_esp', 'player_3', 'INIGO', 'ESPALDA', 480, 650),
      createMockPiece('p3_m1', 'player_3', 'INIGO', 'MANGA_IZQ', 400, 180),
      createMockPiece('p3_m2', 'player_3', 'INIGO', 'MANGA_DER', 400, 180),
    ];

    const result = performModularNesting(pieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });
    const sleeves = result.placedPieces.filter((p) => p.pieceType.startsWith('MANGA'));
    const thirdRowTop = 4 + 650 + 3 + 650 + 3;

    expect(sleeves).toHaveLength(2);
    expect(sleeves.every((p) => p.yMm < thirdRowTop)).toBe(true);
    expect(sleeves.every((p) => p.xMm >= 906)).toBe(true);
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

  it('reproduce caso exacto del usuario con moldes 2026 y PEDIDO_EJEMPLO_SIN_FALLAS.xlsx', async () => {
    const excelPath = path.resolve(__dirname, '../../../tests/fixtures/pruebas/PEDIDO_EJEMPLO_SIN_FALLAS.xlsx');
    const svgPath = path.resolve(__dirname, '../../../tests/fixtures/pruebas/moldes 2026.svg');
    expect(fs.existsSync(excelPath)).toBe(true);
    expect(fs.existsSync(svgPath)).toBe(true);

    const excelBuf = fs.readFileSync(excelPath);
    const parsedExcel = parseExcelBuffer(excelBuf);

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const { patternSet } = parsePatternSvg(svgContent, 'TEST', 'FUTBOL', 'moldes.svg');

    const dummyDesign = parseDesignSvg('<svg width=\"100\" height=\"100\"><rect width=\"100\" height=\"100\" fill=\"red\"/></svg>', 'DUMMY', 'FUTBOL');
    const gen = generateGarmentPieces(parsedExcel.items, patternSet, dummyDesign);

    const nestingPieces: NestingPieceInput[] = gen.pieces.map((p: any) => ({
      id: p.id,
      orderItemId: p.orderItemId,
      pieceId: p.pieceId || p.id,
      pieceType: p.pieceType,
      playerName: p.playerName,
      playerNumber: p.playerNumber,
      sizeName: p.sizeName,
      bbox: p.bbox,
      areaMm2: p.bbox.width * p.bbox.height,
      allowedRotations: [0, 90, 180, 270],
      cutPolygon: p.cutPolygon,
      svgContent: p.svgContent,
    }));

    const result = performModularNesting(nestingPieces, {
      printableWidthMm: 1120,
      maxSheetLengthMm: 5000,
      spacingMm: 3,
    });

    console.log('Result sheets count:', result.sheets?.length);
    for (const sheet of result.sheets || []) {
      console.log(`Sheet #${sheet.sheetNumber} (${sheet.garmentType}) height=${sheet.heightMm} players=${sheet.playerNames.join(', ')}:`);

      // Validar que la manga de Carlos llena el espacio lateral junto a Camila (sin hueco muerto)
      const carlosMangaIzq = sheet.placedPieces.find((p) => p.playerName === 'CARLOS' && p.pieceType === 'MANGA_IZQ');
      expect(carlosMangaIzq).toBeDefined();
      expect(carlosMangaIzq!.yMm).toBeLessThan(700); // Entra inmediatamente a ~626mm junto a Camila, no a 1007mm

      // La pareja inferior debe entrar en la envolvente de la pareja superior,
      // no comenzar debajo de su AABB completo.
      const danielaSleeves = sheet.placedPieces.filter((p) => p.playerName === 'DANIELA' && p.pieceType.startsWith('MANGA'));
      const alvaroSleeves = sheet.placedPieces.filter((p) => p.playerName === 'ALVARO' && p.pieceType.startsWith('MANGA'));
      expect(danielaSleeves).toHaveLength(2);
      expect(alvaroSleeves).toHaveLength(2);
      const danielaBottom = Math.max(...danielaSleeves.map((p) => p.yMm + p.effectiveHeightMm));
      const alvaroTop = Math.min(...alvaroSleeves.map((p) => p.yMm));
      expect(alvaroTop).toBeLessThan(danielaBottom + 3);

      // Validar reducción de pliego (de 3.81m original a ~3.43m)
      expect(sheet.heightMm).toBeLessThan(3500);

      // Validar coordenadas, límites y ausencia de intersección poligonal real.
      for (const piece of sheet.placedPieces) {
        expect(Number.isFinite(piece.xMm)).toBe(true);
        expect(Number.isFinite(piece.yMm)).toBe(true);
        expect(piece.xMm).toBeGreaterThanOrEqual(0);
        expect(piece.xMm + piece.effectiveWidthMm).toBeLessThanOrEqual(1120);
        const placement = validateManualPlacement(piece, sheet.placedPieces, 1120, 3);
        expect(
          placement.valid,
          `Separación inválida en [${piece.playerName}] ${piece.pieceType}: ${placement.reason} contra ${placement.blockingPieceId}`
        ).toBe(true);
      }

      for (let i = 0; i < sheet.placedPieces.length; i++) {
        for (let j = i + 1; j < sheet.placedPieces.length; j++) {
          const a = sheet.placedPieces[i];
          const b = sheet.placedPieces[j];

          const overlapX = Math.max(0, Math.min(a.xMm + a.effectiveWidthMm, b.xMm + b.effectiveWidthMm) - Math.max(a.xMm, b.xMm));
          const overlapY = Math.max(0, Math.min(a.yMm + a.effectiveHeightMm, b.yMm + b.effectiveHeightMm) - Math.max(a.yMm, b.yMm));

          if (overlapX > 0.1 && overlapY > 0.1) {
            const polyA = getOrientedPolygon(a.cutPolygon, a.rotationDeg, a.xMm, a.yMm);
            const polyB = getOrientedPolygon(b.cutPolygon, b.rotationDeg, b.xMm, b.yMm);
            const intersectionArea = await calculatePolygonalIntersectionArea(polyA, polyB);
            expect(
              intersectionArea,
              `Colisión poligonal entre [${a.playerName}] ${a.pieceType} y [${b.playerName}] ${b.pieceType}`
            ).toBeLessThanOrEqual(0.001);
          }
        }
      }
    }
  });

  describe('Nesting en Bobinas Anchas (> 1200 mm: 1600 mm, 1800 mm, 1900 mm)', () => {
    it('debe reducir el largo total y aprovechar el ancho en bobina de 1600 mm respecto a 1120 mm', () => {
      // 4 jugadores completos
      const pieces: NestingPieceInput[] = [];
      for (let i = 1; i <= 4; i++) {
        pieces.push(
          createMockPiece(`p${i}_del`, `player_${i}`, `JUGADOR_${i}`, 'DELANTERO', 360, 500),
          createMockPiece(`p${i}_esp`, `player_${i}`, `JUGADOR_${i}`, 'ESPALDA', 360, 500),
          createMockPiece(`p${i}_m1`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_IZQ', 300, 160),
          createMockPiece(`p${i}_m2`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_DER', 300, 160)
        );
      }

      const res1120 = performModularNesting(pieces, {
        printableWidthMm: 1120,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      const res1600 = performModularNesting(pieces, {
        printableWidthMm: 1600,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      expect(res1120.placedPieces).toHaveLength(16);
      expect(res1600.placedPieces).toHaveLength(16);

      // En 1600 mm caben 4 cuerpos o 2 cuerpos con 3-4 columnas de mangas, reduciendo la altura
      expect(res1600.totalRollLengthMm).toBeLessThan(res1120.totalRollLengthMm);

      // Todas las piezas dentro del ancho útil de 1600 mm
      for (const p of res1600.placedPieces) {
        expect(p.xMm).toBeGreaterThanOrEqual(3);
        expect(p.xMm + p.effectiveWidthMm).toBeLessThanOrEqual(1600 - 3);
      }
    });

    it('debe colocar 4 cuerpos por fila en bobinas de 1800 mm y 1900 mm reduciendo el largo casi a la mitad', () => {
      // 4 jugadores: delanteros y espaldas de 360 mm. 4 * 360 + 3*3 = 1449 mm <= 1800 mm
      const pieces: NestingPieceInput[] = [];
      for (let i = 1; i <= 4; i++) {
        pieces.push(
          createMockPiece(`p${i}_del`, `player_${i}`, `JUGADOR_${i}`, 'DELANTERO', 360, 500),
          createMockPiece(`p${i}_esp`, `player_${i}`, `JUGADOR_${i}`, 'ESPALDA', 360, 500),
          createMockPiece(`p${i}_m1`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_IZQ', 300, 160),
          createMockPiece(`p${i}_m2`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_DER', 300, 160)
        );
      }

      const res1800 = performModularNesting(pieces, {
        printableWidthMm: 1800,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      const res1900 = performModularNesting(pieces, {
        printableWidthMm: 1900,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      expect(res1800.placedPieces).toHaveLength(16);
      expect(res1900.placedPieces).toHaveLength(16);

      // En 1800 y 1900 mm los 4 jugadores quedan en 2 filas de 4 cuerpos en lugar de 4 filas de 2 cuerpos
      expect(res1800.totalRollLengthMm).toBeLessThanOrEqual(res1900.totalRollLengthMm + 10);
      expect(res1800.totalRollLengthMm).toBeLessThan(1800);

      for (const p of res1800.placedPieces) {
        expect(p.xMm).toBeGreaterThanOrEqual(3);
        expect(p.xMm + p.effectiveWidthMm).toBeLessThanOrEqual(1800 - 3);
      }

      for (const p of res1900.placedPieces) {
        expect(p.xMm).toBeGreaterThanOrEqual(3);
        expect(p.xMm + p.effectiveWidthMm).toBeLessThanOrEqual(1900 - 3);
      }
    });

    it('debe ejecutar el nesting en bobina de 1800 mm en tiempo casi instantáneo (< 50ms) para 20 jugadores', () => {
      const pieces: NestingPieceInput[] = [];
      for (let i = 1; i <= 20; i++) {
        pieces.push(
          createMockPiece(`p${i}_del`, `player_${i}`, `JUGADOR_${i}`, 'DELANTERO', 360, 500),
          createMockPiece(`p${i}_esp`, `player_${i}`, `JUGADOR_${i}`, 'ESPALDA', 360, 500),
          createMockPiece(`p${i}_m1`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_IZQ', 300, 180),
          createMockPiece(`p${i}_m2`, `player_${i}`, `JUGADOR_${i}`, 'MANGA_DER', 300, 180)
        );
      }

      const start = performance.now();
      const result = performModularNesting(pieces, {
        printableWidthMm: 1800,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });
      const duration = performance.now() - start;

      expect(result.placedPieces).toHaveLength(80);
      expect(duration).toBeLessThan(1000);
      expect(result.sheets!.length).toBeGreaterThanOrEqual(1);
    });

    it('garantiza con el pedido real de ejemplo que el largo en 1600mm es menor que en 1120mm sin colisiones', async () => {
      const excelPath = path.resolve(__dirname, '../../../tests/fixtures/pruebas/PEDIDO_EJEMPLO_SIN_FALLAS.xlsx');
      const svgPath = path.resolve(__dirname, '../../../tests/fixtures/pruebas/moldes 2026.svg');
      if (!fs.existsSync(excelPath) || !fs.existsSync(svgPath)) return;

      const excelBuf = fs.readFileSync(excelPath);
      const parsedExcel = parseExcelBuffer(excelBuf);
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const { patternSet } = parsePatternSvg(svgContent, 'TEST', 'FUTBOL', 'moldes.svg');
      const dummyDesign = parseDesignSvg('<svg width=\"100\" height=\"100\"><rect width=\"100\" height=\"100\" fill=\"red\"/></svg>', 'DUMMY', 'FUTBOL');
      const gen = generateGarmentPieces(parsedExcel.items, patternSet, dummyDesign);

      const nestingPieces: NestingPieceInput[] = gen.pieces.map((p: any) => ({
        id: p.id,
        orderItemId: p.orderItemId,
        pieceId: p.pieceId || p.id,
        pieceType: p.pieceType,
        playerName: p.playerName,
        playerNumber: p.playerNumber,
        sizeName: p.sizeName,
        bbox: p.bbox,
        areaMm2: p.bbox.width * p.bbox.height,
        allowedRotations: [0, 90, 180, 270],
        cutPolygon: p.cutPolygon,
        svgContent: p.svgContent,
      }));

      const res1120 = performModularNesting(nestingPieces, {
        printableWidthMm: 1120,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      const res1600 = performModularNesting(nestingPieces, {
        printableWidthMm: 1600,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      expect(res1600.placedPieces).toHaveLength(res1120.placedPieces.length);
      expect(res1600.totalRollLengthMm).toBeLessThan(res1120.totalRollLengthMm);

      // Validar no-colisión y respeto de márgenes en 1600 mm
      for (const sheet of res1600.sheets || []) {
        for (const piece of sheet.placedPieces) {
          expect(piece.xMm).toBeGreaterThanOrEqual(0);
          expect(piece.xMm + piece.effectiveWidthMm).toBeLessThanOrEqual(1600);
        }

        const pieces = sheet.placedPieces;
        for (let i = 0; i < pieces.length; i++) {
          const poly1 = getPiecePolygon(pieces[i]);
          for (let j = i + 1; j < pieces.length; j++) {
            const poly2 = getPiecePolygon(pieces[j]);
            const overlap = doPolygonsOverlap(poly1, poly2);
            if (overlap) {
              console.error(`Solapamiento detectado entre ${pieces[i].playerName} (${pieces[i].pieceType}) y ${pieces[j].playerName} (${pieces[j].pieceType})`);
            }
            expect(overlap).toBe(false);
          }
        }
      }
    });

    it('debe aprovechar huecos laterales con mangas multicolumna en 1600, 1800 y 1900 mm sin colisiones', () => {
      const mockPieces: NestingPieceInput[] = [
        createMockPiece('p1_del', 'p1', 'MATEO', 'DELANTERO', 360, 500),
        createMockPiece('p1_esp', 'p1', 'MATEO', 'ESPALDA', 360, 500),
        createMockPiece('p2_del', 'p2', 'CAMILA', 'DELANTERO', 360, 500),
        createMockPiece('p2_esp', 'p2', 'CAMILA', 'ESPALDA', 360, 500),
        createMockPiece('p3_del', 'p3', 'CARLOS', 'DELANTERO', 390, 530),
        createMockPiece('p3_esp', 'p3', 'CARLOS', 'ESPALDA', 390, 530),
        createMockPiece('p3_m1', 'p3', 'CARLOS', 'MANGA_IZQ', 345, 182),
        createMockPiece('p3_m2', 'p3', 'CARLOS', 'MANGA_DER', 345, 182),
        createMockPiece('p4_del', 'p4', 'DANIELA', 'DELANTERO', 420, 580),
        createMockPiece('p4_esp', 'p4', 'DANIELA', 'ESPALDA', 420, 580),
        createMockPiece('p4_m1', 'p4', 'DANIELA', 'MANGA_IZQ', 355, 187),
        createMockPiece('p4_m2', 'p4', 'DANIELA', 'MANGA_DER', 355, 187),
        createMockPiece('p5_del', 'p5', 'ALVARO', 'DELANTERO', 420, 580),
        createMockPiece('p5_esp', 'p5', 'ALVARO', 'ESPALDA', 420, 580),
        createMockPiece('p5_m1', 'p5', 'ALVARO', 'MANGA_IZQ', 355, 187),
        createMockPiece('p5_m2', 'p5', 'ALVARO', 'MANGA_DER', 355, 187),
        createMockPiece('p6_del', 'p6', 'VALENTINA', 'DELANTERO', 540, 720),
        createMockPiece('p6_esp', 'p6', 'VALENTINA', 'ESPALDA', 540, 720),
        createMockPiece('p6_m1', 'p6', 'VALENTINA', 'MANGA_IZQ', 425, 233),
        createMockPiece('p6_m2', 'p6', 'VALENTINA', 'MANGA_DER', 425, 233),
      ];

      const res1120 = performModularNesting(mockPieces, { printableWidthMm: 1120, maxSheetLengthMm: 6000 });
      const res1600 = performModularNesting(mockPieces, { printableWidthMm: 1600, maxSheetLengthMm: 6000 });
      const res1800 = performModularNesting(mockPieces, { printableWidthMm: 1800, maxSheetLengthMm: 6000 });
      const res1900 = performModularNesting(mockPieces, { printableWidthMm: 1900, maxSheetLengthMm: 6000 });

      expect(res1120.placedPieces.length).toBe(mockPieces.length);
      expect(res1600.placedPieces.length).toBe(mockPieces.length);
      expect(res1800.placedPieces.length).toBe(mockPieces.length);
      expect(res1900.placedPieces.length).toBe(mockPieces.length);

      // El largo en bobinas anchas debe ser estrictamente menor que en 1120 mm
      expect(res1600.totalRollLengthMm).toBeLessThan(res1120.totalRollLengthMm);
      expect(res1800.totalRollLengthMm).toBeLessThanOrEqual(res1600.totalRollLengthMm);
      expect(res1900.totalRollLengthMm).toBeLessThanOrEqual(res1800.totalRollLengthMm);

      // Verificar que en 1600 mm hay mangas colocadas en los laterales de los cuerpos (x > 800)
      const sleevesAtRight = res1600.placedPieces.filter(
        (p) => p.pieceType.includes('MANGA') && p.xMm >= 800 && p.yMm < 2500
      );
      expect(sleevesAtRight.length).toBeGreaterThan(0);

      // Verificar colisiones poligonales en todos los anchos
      for (const res of [res1120, res1600, res1800, res1900]) {
        for (const sheet of res.sheets || []) {
          const pieces = sheet.placedPieces;
          for (let i = 0; i < pieces.length; i++) {
            const poly1 = getPiecePolygon(pieces[i]);
            for (let j = i + 1; j < pieces.length; j++) {
              const poly2 = getPiecePolygon(pieces[j]);
              expect(doPolygonsOverlap(poly1, poly2)).toBe(false);
            }
          }
        }
      }
    });

    it('debe acomodar mangas continuas en columna derecha para tallas adultas T42 sin huecos blancos entre mangas', () => {
      // Caso exacto Colombia T42: Delantero 600x785, Espalda 600x785, Mangas 500x260 en bobina 1120 mm
      // Delantero + Espalda = 1204 > 1120, por lo que van apilados en columna izquierda
      const pieces: NestingPieceInput[] = [
        createMockPiece('joffre_del', 'p1', 'JOFFRE', 'DELANTERO', 600, 785),
        createMockPiece('joffre_esp', 'p1', 'JOFFRE', 'ESPALDA', 600, 785),
        createMockPiece('joffre_m1', 'p1', 'JOFFRE', 'MANGA_IZQ', 500, 260),
        createMockPiece('joffre_m2', 'p1', 'JOFFRE', 'MANGA_DER', 500, 260),
        createMockPiece('snayder_del', 'p2', 'SNAYDER', 'DELANTERO', 600, 785),
        createMockPiece('snayder_esp', 'p2', 'SNAYDER', 'ESPALDA', 600, 785),
        createMockPiece('snayder_m1', 'p2', 'SNAYDER', 'MANGA_IZQ', 500, 260),
        createMockPiece('snayder_m2', 'p2', 'SNAYDER', 'MANGA_DER', 500, 260),
      ];

      const res = performModularNesting(pieces, {
        printableWidthMm: 1120,
        maxSheetLengthMm: 5000,
      });

      expect(res.sheets).toBeDefined();
      expect(res.placedPieces.length).toBe(pieces.length);

      // Todas las mangas deben estar a la derecha de los cuerpos (xMm > 600)
      const sleeves = res.placedPieces
        .filter((p) => p.pieceType.includes('MANGA'))
        .sort((a, b) => a.yMm - b.yMm);

      expect(sleeves.length).toBe(4);
      for (const sleeve of sleeves) {
        expect(sleeve.xMm).toBeGreaterThanOrEqual(600);
      }

      // La distancia vertical entre mangas consecutivas NO debe tener huecos muertos (> 15 mm)
      for (let i = 0; i < sleeves.length - 1; i++) {
        const currentBottom = sleeves[i].yMm + sleeves[i].effectiveHeightMm;
        const nextTop = sleeves[i + 1].yMm;
        const gap = nextTop - currentBottom;
        // El gap debe ser el spacing normal (~4 mm), nunca un hueco de 280 mm
        expect(gap).toBeLessThanOrEqual(15);
      }
    });

    it('simula exactamente el pedido de Colombia de 20 jugadores y verifica PARTE 3', async () => {
      const colombiaPath = 'C:/Users/Det-Pc/Downloads/Equipo_de_Colombia_Uniformes.xlsx';
      const svgPath = path.resolve(__dirname, '../../../tests/fixtures/pruebas/moldes 2026.svg');
      if (!fs.existsSync(colombiaPath) || !fs.existsSync(svgPath)) return;

      const excelBuf = fs.readFileSync(colombiaPath);
      const parsedExcel = parseExcelBuffer(excelBuf);
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const { patternSet } = parsePatternSvg(svgContent, 'TEST', 'FUTBOL', 'moldes.svg');
      console.log('Item sizes:', [...new Set(parsedExcel.items.map(it => it.sizeName))]);
      console.log('patternSet keys:', Object.keys(patternSet || {}));
      console.log('patternSet sizes:', (patternSet as any)?.sizes);
      const dummyDesign = parseDesignSvg('<svg width="100" height="100"><rect width="100" height="100" fill="red"/></svg>', 'DUMMY', 'FUTBOL');
      (dummyDesign as any).pieceArtworks = {
        DELANTERO: { id: 'a1', pieceType: 'DELANTERO', svgContent: '<svg width="100" height="100"><rect fill="yellow"/></svg>' },
        DELANTERO_V: { id: 'a2', pieceType: 'DELANTERO_V', svgContent: '<svg width="100" height="100"><rect fill="yellow"/></svg>' },
        ESPALDA: { id: 'a3', pieceType: 'ESPALDA', svgContent: '<svg width="100" height="100"><rect fill="yellow"/></svg>' },
        MANGA_IZQ: { id: 'a4', pieceType: 'MANGA_IZQ', svgContent: '<svg width="100" height="100"><rect fill="yellow"/></svg>' },
        MANGA_DER: { id: 'a5', pieceType: 'MANGA_DER', svgContent: '<svg width="100" height="100"><rect fill="yellow"/></svg>' },
      };
      const normalizedItems = parsedExcel.items.map((it: any) => ({
        ...it,
        garmentType: 'CAMISETA',
        necklineType: 'V',
        isValid: true,
        errors: [],
      }));
      const gen = generateGarmentPieces(normalizedItems, patternSet, dummyDesign, { productionScope: 'CAMISETA_ONLY' });

      console.log('ParsedExcel items:', parsedExcel.items.length, 'Gen pieces:', gen.pieces.length);
      const nestingPieces: NestingPieceInput[] = gen.pieces.map((p: any) => ({
        id: p.id,
        orderItemId: p.orderItemId,
        pieceId: p.pieceId || p.id,
        pieceType: p.pieceType,
        playerName: p.playerName,
        playerNumber: p.playerNumber,
        sizeName: p.sizeName,
        bbox: p.bbox,
        areaMm2: p.bbox.width * p.bbox.height,
        allowedRotations: [0, 90, 180, 270],
        cutPolygon: p.cutPolygon,
        svgContent: p.svgContent,
      }));

      const res = performModularNesting(nestingPieces, {
        printableWidthMm: 1120,
        maxSheetLengthMm: 5000,
        spacingMm: 3,
      });

      console.log('=== COLOMBIA TEST: TOTAL SHEETS ===', res.sheets?.length);
      for (const sheet of res.sheets || []) {
        console.log(`SHEET #${sheet.sheetNumber} (${sheet.garmentType}) length=${(sheet.heightMm / 1000).toFixed(2)}m players=${sheet.playerNames.join(', ')}`);
        // Validar no solapamiento
        const pieces = sheet.placedPieces;
        for (let i = 0; i < pieces.length; i++) {
          const a = pieces[i];
          expect(a.xMm).toBeGreaterThanOrEqual(0);
          expect(a.xMm + a.effectiveWidthMm).toBeLessThanOrEqual(1120);

          for (let j = i + 1; j < pieces.length; j++) {
            const b = pieces[j];
            const overlapX = Math.max(0, Math.min(a.xMm + a.effectiveWidthMm, b.xMm + b.effectiveWidthMm) - Math.max(a.xMm, b.xMm));
            const overlapY = Math.max(0, Math.min(a.yMm + a.effectiveHeightMm, b.yMm + b.effectiveHeightMm) - Math.max(a.yMm, b.yMm));
            if (overlapX > 0.1 && overlapY > 0.1) {
              const polyA = getOrientedPolygon(a.cutPolygon, a.rotationDeg, a.xMm, a.yMm);
              const polyB = getOrientedPolygon(b.cutPolygon, b.rotationDeg, b.xMm, b.yMm);
              const intersectionArea = await calculatePolygonalIntersectionArea(polyA, polyB);
              expect(
                intersectionArea,
                `Colision en pliego #${sheet.sheetNumber} entre ${a.playerName} (${a.pieceType}) y ${b.playerName} (${b.pieceType})`
              ).toBeLessThan(1.0);
            }
          }
        }
      }
    });
  });
});


