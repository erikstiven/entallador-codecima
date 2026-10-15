import { describe, it, expect } from 'vitest';
import { 
  generateGarmentPieces, 
  filterReprintPieces,
  pieceSvgRegistry,
  getPieceSvgContent,
  resolvePieceSvg,
  getPieceMoldPath,
  clearPieceSvgRegistry,
} from './garmentGenerator';
import { OrderItem } from '@/modules/orders/types';
import { PatternSet } from '@/modules/patterns/types';
import { MasterDesign } from '@/modules/designs/types';

describe('Garment Generator Engine (Fusión de Molde + Diseño + Jugador)', () => {
  const mockPatternSet: PatternSet = {
    id: 'pat_test_01',
    name: 'MOLDES FUTBOL 2026',
    garmentType: 'FUTBOL',
    sizes: [
      {
        id: 'sz_28',
        sizeName: '28',
        sortOrder: 1,
        pieces: [
          {
            id: 'p_t28_delantero',
            sizeName: '28',
            pieceType: 'DELANTERO',
            pieceName: 'T28_DELANTERO',
            cutPolygon: [{ x: 50, y: 50 }, { x: 500, y: 50 }, { x: 500, y: 650 }, { x: 50, y: 650 }],
            bbox: { minX: 50, minY: 50, maxX: 500, maxY: 650, width: 450, height: 600 },
            areaMm2: 270000,
            allowedRotationsDeg: [0],
            svgPathData: 'M 50 50 L 500 50 L 500 650 L 50 650 Z',
            originalElementId: 'T28_DELANTERO',
            placeholders: [],
            isAssigned: true,
          },
          {
            id: 'p_t28_espalda',
            sizeName: '28',
            pieceType: 'ESPALDA',
            pieceName: 'T28_ESPALDA',
            cutPolygon: [{ x: 50, y: 50 }, { x: 500, y: 50 }, { x: 500, y: 670 }, { x: 50, y: 670 }],
            bbox: { minX: 50, minY: 50, maxX: 500, maxY: 670, width: 450, height: 620 },
            areaMm2: 279000,
            allowedRotationsDeg: [0],
            svgPathData: 'M 50 50 L 500 50 L 500 670 L 50 670 Z',
            originalElementId: 'T28_ESPALDA',
            placeholders: [],
            isAssigned: true,
          },
          {
            id: 'p_t28_manga_i',
            sizeName: '28',
            pieceType: 'MANGA_IZQ',
            pieceName: 'T28_MANGA_I',
            cutPolygon: [{ x: 0, y: 0 }, { x: 240, y: 0 }, { x: 240, y: 200 }, { x: 0, y: 200 }],
            bbox: { minX: 0, minY: 0, maxX: 240, maxY: 200, width: 240, height: 200 },
            areaMm2: 48000,
            allowedRotationsDeg: [0, 180],
            svgPathData: 'M 0 0 L 240 0 L 240 200 L 0 200 Z',
            originalElementId: 'T28_MANGA_I',
            placeholders: [],
            isAssigned: true,
          },
          {
            id: 'p_t28_manga_d',
            sizeName: '28',
            pieceType: 'MANGA_DER',
            pieceName: 'T28_MANGA_D',
            cutPolygon: [{ x: 0, y: 0 }, { x: 240, y: 0 }, { x: 240, y: 200 }, { x: 0, y: 200 }],
            bbox: { minX: 0, minY: 0, maxX: 240, maxY: 200, width: 240, height: 200 },
            areaMm2: 48000,
            allowedRotationsDeg: [0, 180],
            svgPathData: 'M 0 0 L 240 0 L 240 200 L 0 200 Z',
            originalElementId: 'T28_MANGA_D',
            placeholders: [],
            isAssigned: true,
          },
          {
            id: 'p_t28_short_f',
            sizeName: '28',
            pieceType: 'SHORT_FRENTE',
            pieceName: 'T28_SHORT_F',
            cutPolygon: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 420 }, { x: 0, y: 420 }],
            bbox: { minX: 0, minY: 0, maxX: 300, maxY: 420, width: 300, height: 420 },
            areaMm2: 126000,
            allowedRotationsDeg: [0, 180],
            svgPathData: 'M 0 0 L 300 0 L 300 420 L 0 420 Z',
            originalElementId: 'T28_SHORT_F',
            placeholders: [],
            isAssigned: true,
          },
          {
            id: 'p_t28_short_a',
            sizeName: '28',
            pieceType: 'SHORT_ESPALDA',
            pieceName: 'T28_SHORT_A',
            cutPolygon: [{ x: 0, y: 0 }, { x: 320, y: 0 }, { x: 320, y: 440 }, { x: 0, y: 440 }],
            bbox: { minX: 0, minY: 0, maxX: 320, maxY: 440, width: 320, height: 440 },
            areaMm2: 140800,
            allowedRotationsDeg: [0, 180],
            svgPathData: 'M 0 0 L 320 0 L 320 440 L 0 440 Z',
            originalElementId: 'T28_SHORT_A',
            placeholders: [],
            isAssigned: true,
          },
        ],
      },
    ],
    unassignedPieces: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDesign: MasterDesign = {
    id: 'des_holanda',
    name: 'Holanda Naranja Clásico',
    sport: 'FUTBOL',
    colors: ['#ea580c', '#0284c7', '#ffffff'],
    pieceArtworks: {
      DELANTERO: {
        pieceType: 'DELANTERO',
        svgArtContent: '<rect fill="#ea580c" />',
        placeholders: [],
      },
      ESPALDA: {
        pieceType: 'ESPALDA',
        svgArtContent: '<rect fill="#ea580c" />',
        placeholders: [],
      },
      MANGA_IZQ: {
        pieceType: 'MANGA_IZQ',
        svgArtContent: '<rect fill="#ea580c" />',
        placeholders: [],
      },
      MANGA_DER: {
        pieceType: 'MANGA_DER',
        svgArtContent: '<rect fill="#ea580c" />',
        placeholders: [],
      },
      SHORT_FRENTE: {
        pieceType: 'SHORT_FRENTE',
        svgArtContent: '<rect fill="#ea580c" />',
        placeholders: [],
      },
      SHORT_ESPALDA: {
        pieceType: 'SHORT_ESPALDA',
        svgArtContent: '<rect fill="#ea580c" />',
        placeholders: [],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('debe generar exactamente la cantidad de piezas físicas según el tipo de uniforme', () => {
    const orderItems: OrderItem[] = [
      {
        id: 'item_01',
        rowNumber: 1,
        playerName: 'MATEO',
        playerNumber: '10',
        sizeName: '28',
        garmentType: 'COMPLETO', // Requiere 6 piezas
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        id: 'item_02',
        rowNumber: 2,
        playerName: 'CARLOS',
        playerNumber: '21',
        sizeName: '28',
        garmentType: 'CAMISETA', // Requiere 4 piezas (sin shorts)
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        id: 'item_03',
        rowNumber: 3,
        playerName: 'DANIELA',
        playerNumber: '15',
        sizeName: '28',
        garmentType: 'SHORT', // Requiere 2 piezas (solo shorts)
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const result = generateGarmentPieces(orderItems, mockPatternSet, mockDesign);

    // 6 + 4 + 2 = 12 piezas en total
    expect(result.totalPieces).toBe(12);
    expect(result.pieces.length).toBe(12);
    expect(result.totalGarments).toBe(3);

    // Verificar pieza de espalda de MATEO
    const mateoEspalda = result.pieces.find(
      (p) => p.playerName === 'MATEO' && p.pieceType === 'ESPALDA'
    );
    expect(mateoEspalda).toBeDefined();
    expect(mateoEspalda?.bbox.width).toBe(450);
    expect(mateoEspalda?.svgContent).toContain('dorsal_nombre_');
    expect(mateoEspalda?.svgContent).toContain('dorsal_numero_');
    expect(mateoEspalda?.svgContent).toContain('<path');
    expect(mateoEspalda?.label.text).toBe('MATEO | #10 | T28 | ESPALDA');
    expect(mateoEspalda?.allowedRotationsDeg).toEqual([0]);

    // Verificar manga de CARLOS
    const carlosManga = result.pieces.find(
      (p) => p.playerName === 'CARLOS' && p.pieceType === 'MANGA_IZQ'
    );
    expect(carlosManga).toBeDefined();
    expect(carlosManga?.allowedRotationsDeg).toEqual([0, 180]);

    // Verificar que CARLOS (CAMISETA) no tenga shorts
    const carlosShort = result.pieces.find(
      (p) => p.playerName === 'CARLOS' && p.pieceType === 'SHORT_FRENTE'
    );
    expect(carlosShort).toBeUndefined();

    // Verificar que DANIELA (SHORT) solo tenga short frente y espalda
    const danielaPieces = result.pieces.filter((p) => p.playerName === 'DANIELA');
    expect(danielaPieces.length).toBe(2);
    expect(danielaPieces.map((p) => p.pieceType).sort()).toEqual(['SHORT_ESPALDA', 'SHORT_FRENTE']);
    const danielaShortDerecho = danielaPieces.find((p) => p.pieceType === 'SHORT_ESPALDA');
    expect(danielaShortDerecho?.svgContent).toContain('short_numero_');
    expect(danielaShortDerecho?.svgContent).toContain('15');
    expect(danielaPieces.find((p) => p.pieceType === 'SHORT_FRENTE')?.svgContent).not.toContain('short_numero_');
  });

  it('debe filtrar correctamente piezas individuales para la función de Reimpresión', () => {
    const orderItems: OrderItem[] = [
      {
        id: 'item_01',
        rowNumber: 1,
        playerName: 'MATEO',
        playerNumber: '10',
        sizeName: '28',
        garmentType: 'COMPLETO',
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const result = generateGarmentPieces(orderItems, mockPatternSet, mockDesign);

    // Reimprimir únicamente la ESPALDA de MATEO
    const reprintEspalda = filterReprintPieces(result.pieces, {
      playerName: 'MATEO',
      pieceType: 'ESPALDA',
    });

    expect(reprintEspalda.length).toBe(1);
    expect(reprintEspalda[0].pieceName).toContain('MATEO_#10_T28_ESPALDA');
  });

  it('debe almacenar los SVGs en pieceSvgRegistry (Patrón Flyweight) y resolverlos bajo demanda', () => {
    clearPieceSvgRegistry();
    const orderItems: OrderItem[] = [
      {
        id: 'item_flyweight',
        rowNumber: 1,
        playerName: 'ANDRES',
        playerNumber: '7',
        sizeName: '28',
        garmentType: 'CAMISETA',
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const result = generateGarmentPieces(orderItems, mockPatternSet, mockDesign);
    expect(result.pieces.length).toBe(4);

    const piece = result.pieces[0];
    // Debe existir en el registro Flyweight fuera de Zustand
    expect(pieceSvgRegistry.has(piece.id)).toBe(true);
    expect(getPieceSvgContent(piece.id)).toBe(pieceSvgRegistry.get(piece.id));

    // Debe resolverse mediante resolvePieceSvg
    expect(resolvePieceSvg(piece)).toContain(piece.id);

    // Debe ser accesible mediante getter en GeneratedPiece
    expect(piece.svgContent).toBe(getPieceSvgContent(piece.id));

    // Limpieza
    clearPieceSvgRegistry();
    expect(pieceSvgRegistry.size).toBe(0);
    expect(getPieceSvgContent(piece.id)).toBe('');
  });

  it('debe reutilizar el arte escalado para jugadores de la misma talla y molde', () => {
    const orderItems: OrderItem[] = [
      {
        id: 'item_a',
        rowNumber: 1,
        playerName: 'JUGADOR A',
        playerNumber: '1',
        sizeName: '28',
        garmentType: 'CAMISETA',
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        id: 'item_b',
        rowNumber: 2,
        playerName: 'JUGADOR B',
        playerNumber: '2',
        sizeName: '28',
        garmentType: 'CAMISETA',
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const result = generateGarmentPieces(orderItems, mockPatternSet, mockDesign);
    expect(result.pieces.length).toBe(8);

    const pieceA = result.pieces.find((p) => p.playerName === 'JUGADOR A' && p.pieceType === 'DELANTERO')!;
    const pieceB = result.pieces.find((p) => p.playerName === 'JUGADOR B' && p.pieceType === 'DELANTERO')!;

    expect(pieceA).toBeDefined();
    expect(pieceB).toBeDefined();
    // Ambos tienen sus piezas registradas en el registry
    expect(pieceSvgRegistry.has(pieceA.id)).toBe(true);
    expect(pieceSvgRegistry.has(pieceB.id)).toBe(true);
  });

  it('debe aplicar y actualizar correctamente los offsets verticales de calibración (sleeve, front, back, short) y preservar IDs con namespace sin colisiones', () => {
    const svgWithIds = (tagId: string) =>
      `<svg viewBox="0 0 200 200"><defs><style>.cls-1{fill:url(#${tagId});stroke:#1a2b3c}</style><linearGradient id="${tagId}"><stop offset="0%" stop-color="#ff00aa"/></linearGradient></defs><path class="cls-1" d="M 0 0 L 200 0 L 200 200 L 0 200 Z"/></svg>`;

    const customDesign: MasterDesign = {
      ...mockDesign,
      id: 'des_calib_offsets',
      pieceArtworks: {
        DELANTERO: { pieceType: 'DELANTERO', svgArtContent: svgWithIds('grad_front'), placeholders: [] },
        ESPALDA: { pieceType: 'ESPALDA', svgArtContent: svgWithIds('grad_back'), placeholders: [] },
        MANGA_IZQ: { pieceType: 'MANGA_IZQ', svgArtContent: svgWithIds('grad_sleeve'), placeholders: [] },
        MANGA_DER: { pieceType: 'MANGA_DER', svgArtContent: svgWithIds('grad_sleeve'), placeholders: [] },
        SHORT_FRENTE: { pieceType: 'SHORT_FRENTE', svgArtContent: svgWithIds('grad_short'), placeholders: [] },
        SHORT_ESPALDA: { pieceType: 'SHORT_ESPALDA', svgArtContent: svgWithIds('grad_short'), placeholders: [] },
      },
    };

    const orderItems: OrderItem[] = [
      {
        id: 'item_calib_1',
        rowNumber: 1,
        playerName: 'LUCAS',
        playerNumber: '11',
        sizeName: '28',
        garmentType: 'COMPLETO',
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    // 1. Posición inicial en 0 mm
    const res0 = generateGarmentPieces(orderItems, mockPatternSet, customDesign, {
      sleeveArtOffsetYMm: 0,
      frontArtOffsetYMm: 0,
      backArtOffsetYMm: 0,
      shortArtOffsetYMm: 0,
    });

    const sleevePiece0 = res0.pieces.find((p) => p.pieceType === 'MANGA_IZQ')!;
    const sleeve0 = resolvePieceSvg(sleevePiece0);
    expect(sleeve0).toContain('y="0"');
    expect(sleeve0).toContain('__grad_sleeve');
    expect(getPieceMoldPath(sleevePiece0)).toBe('M 0.00 0.00 L 240.00 0.00 L 240.00 200.00 L 0.00 200.00 Z');

    // 2. Calibrar offsets distintos por zona
    const resMoved = generateGarmentPieces(orderItems, mockPatternSet, customDesign, {
      sleeveArtOffsetYMm: -20,
      frontArtOffsetYMm: -12,
      backArtOffsetYMm: 8,
      shortArtOffsetYMm: -15,
    });

    const frontMoved = resolvePieceSvg(resMoved.pieces.find((p) => p.pieceType === 'DELANTERO')!);
    const backMoved = resolvePieceSvg(resMoved.pieces.find((p) => p.pieceType === 'ESPALDA')!);
    const sleeveMoved = resolvePieceSvg(resMoved.pieces.find((p) => p.pieceType === 'MANGA_IZQ')!);
    const shortMoved = resolvePieceSvg(resMoved.pieces.find((p) => p.pieceType === 'SHORT_FRENTE')!);

    expect(frontMoved).toContain('y="-12"');
    expect(frontMoved).toContain('__grad_front');
    expect(backMoved).toContain('y="8"');
    expect(backMoved).toContain('__grad_back');
    expect(sleeveMoved).toContain('y="-20"');
    expect(sleeveMoved).toContain('__grad_sleeve');
    expect(shortMoved).toContain('y="-15"');
    expect(shortMoved).toContain('__grad_short');

    // 3. Regreso de sleeveArtOffsetYMm de -20 a 0
    const resBackToZero = generateGarmentPieces(orderItems, mockPatternSet, customDesign, {
      sleeveArtOffsetYMm: 0,
      frontArtOffsetYMm: 0,
      backArtOffsetYMm: 0,
      shortArtOffsetYMm: 0,
    });
    const sleeveReset = resolvePieceSvg(resBackToZero.pieces.find((p) => p.pieceType === 'MANGA_IZQ')!);
    expect(sleeveReset).toContain('y="0"');
    expect(sleeveReset).not.toContain('y="-20"');
  });

  it('benchmark: recalibra 40 camisas (160 piezas por corrida, 800 piezas en 5 ajustes) en menos de 50 ms promedio por ajuste', () => {
    const sizes = ['S', 'M', 'L', 'XL'];
    const multiSizePatternSet: PatternSet = {
      id: 'pat_bench_40',
      name: 'MOLDES INDUSTRIALES S-XL',
      garmentType: 'FUTBOL',
      sizes: sizes.map((sz, idx) => ({
        id: `sz_${sz}`,
        sizeName: sz,
        sortOrder: idx + 1,
        pieces: [
          {
            id: `p_${sz}_delantero`,
            sizeName: sz,
            pieceType: 'DELANTERO',
            pieceName: `${sz}_DELANTERO`,
            cutPolygon: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 700 }, { x: 0, y: 700 }],
            bbox: { minX: 0, minY: 0, maxX: 500, maxY: 700, width: 500, height: 700 },
            areaMm2: 350000,
            allowedRotationsDeg: [0],
            svgPathData: 'M 0 0 L 500 0 L 500 700 L 0 700 Z',
            originalElementId: `${sz}_DELANTERO`,
            placeholders: [],
            isAssigned: true,
          },
          {
            id: `p_${sz}_espalda`,
            sizeName: sz,
            pieceType: 'ESPALDA',
            pieceName: `${sz}_ESPALDA`,
            cutPolygon: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 720 }, { x: 0, y: 720 }],
            bbox: { minX: 0, minY: 0, maxX: 500, maxY: 720, width: 500, height: 720 },
            areaMm2: 360000,
            allowedRotationsDeg: [0],
            svgPathData: 'M 0 0 L 500 0 L 500 720 L 0 720 Z',
            originalElementId: `${sz}_ESPALDA`,
            placeholders: [],
            isAssigned: true,
          },
          {
            id: `p_${sz}_manga_i`,
            sizeName: sz,
            pieceType: 'MANGA_IZQ',
            pieceName: `${sz}_MANGA_I`,
            cutPolygon: [{ x: 0, y: 0 }, { x: 260, y: 0 }, { x: 260, y: 220 }, { x: 0, y: 220 }],
            bbox: { minX: 0, minY: 0, maxX: 260, maxY: 220, width: 260, height: 220 },
            areaMm2: 57200,
            allowedRotationsDeg: [0, 180],
            svgPathData: 'M 0 0 L 260 0 L 260 220 L 0 220 Z',
            originalElementId: `${sz}_MANGA_I`,
            placeholders: [],
            isAssigned: true,
          },
          {
            id: `p_${sz}_manga_d`,
            sizeName: sz,
            pieceType: 'MANGA_DER',
            pieceName: `${sz}_MANGA_D`,
            cutPolygon: [{ x: 0, y: 0 }, { x: 260, y: 0 }, { x: 260, y: 220 }, { x: 0, y: 220 }],
            bbox: { minX: 0, minY: 0, maxX: 260, maxY: 220, width: 260, height: 220 },
            areaMm2: 57200,
            allowedRotationsDeg: [0, 180],
            svgPathData: 'M 0 0 L 260 0 L 260 220 L 0 220 Z',
            originalElementId: `${sz}_MANGA_D`,
            placeholders: [],
            isAssigned: true,
          },
        ],
      })),
      unassignedPieces: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const buildIllustratorPieceSvg = (prefix: string) => {
      const styles: string[] = [];
      const defs: string[] = [];
      const paths: string[] = [];
      for (let i = 0; i < 120; i++) {
        styles.push(`.cls-${i}{fill:url(#grad_${prefix}_${i});stroke:#112233}`);
        defs.push(`<linearGradient id="grad_${prefix}_${i}"><stop offset="0%" stop-color="#ff0055"/><stop offset="100%" stop-color="#0055ff"/></linearGradient>`);
        paths.push(`<path class="cls-${i}" d="M ${i * 2} 0 L ${i * 2 + 20} 100 L ${i * 2} 200 Z"/>`);
      }
      return `<svg viewBox="0 0 500 700"><defs><style>${styles.join('')}</style>${defs.join('')}</defs><g>${paths.join('')}</g></svg>`;
    };

    const heavyDesign: MasterDesign = {
      id: 'des_bench_40',
      name: 'Diseño Pesado Illustrator 40 Jugadores',
      sport: 'FUTBOL',
      colors: ['#ff0055', '#0055ff', '#ffffff'],
      pieceArtworks: {
        DELANTERO: { pieceType: 'DELANTERO', svgArtContent: buildIllustratorPieceSvg('front'), placeholders: [] },
        ESPALDA: { pieceType: 'ESPALDA', svgArtContent: buildIllustratorPieceSvg('back'), placeholders: [] },
        MANGA_IZQ: { pieceType: 'MANGA_IZQ', svgArtContent: buildIllustratorPieceSvg('sleeve_l'), placeholders: [] },
        MANGA_DER: { pieceType: 'MANGA_DER', svgArtContent: buildIllustratorPieceSvg('sleeve_r'), placeholders: [] },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const roster40: OrderItem[] = Array.from({ length: 40 }, (_, i) => ({
      id: `player_${i + 1}`,
      rowNumber: i + 1,
      playerName: `JUGADOR ${i + 1}`,
      playerNumber: String((i % 99) + 1),
      sizeName: sizes[i % sizes.length],
      garmentType: 'CAMISETA',
      quantity: 1,
      isValid: true,
      errors: [],
      warnings: [],
    }));

    // 1. Generación inicial de las 40 camisas (160 piezas)
    const initialRes = generateGarmentPieces(roster40, multiSizePatternSet, heavyDesign, {
      sleeveArtOffsetYMm: 0,
      frontArtOffsetYMm: 0,
    });
    expect(initialRes.pieces.length).toBe(160);

    // 2. Medir 5 ajustes consecutivos de calibración (800 piezas generadas en total)
    const sleeveOffsets = [-10, -15, -20, -25, -30];
    const start = performance.now();
    let lastResult = initialRes;
    for (const offset of sleeveOffsets) {
      lastResult = generateGarmentPieces(roster40, multiSizePatternSet, heavyDesign, {
        sleeveArtOffsetYMm: offset,
        frontArtOffsetYMm: -15,
      });
    }
    const totalElapsedMs = performance.now() - start;
    const avgMsPerAdjustment = totalElapsedMs / sleeveOffsets.length;

    expect(lastResult.pieces.length).toBe(160);
    expect(avgMsPerAdjustment).toBeLessThan(50);

    const sampleSleeve = resolvePieceSvg(lastResult.pieces.find((p) => p.pieceType === 'MANGA_IZQ')!);
    const sampleFront = resolvePieceSvg(lastResult.pieces.find((p) => p.pieceType === 'DELANTERO')!);
    expect(sampleSleeve).toContain('y="-30"');
    expect(sampleFront).toContain('y="-15"');
  });

  it('debe espejar automáticamente en X la pantaloneta derecha cuando el conjunto solo incluye 1 molde de pantaloneta', () => {
    // Conjunto con 1 sola pierna de pantaloneta asimétrica (tiro en el lado derecho x=300)
    const singleShortPatternSet: PatternSet = {
      id: 'pat_single_short',
      name: 'MOLDE SHORT ÚNICO',
      garmentType: 'FUTBOL',
      sizes: [
        {
          id: 'sz_28_short',
          sizeName: '28',
          sortOrder: 1,
          pieces: [
            {
              id: 'p_t28_panta_unica',
              sizeName: '28',
              pieceType: 'PANTALONETA_IZQ',
              pieceName: 'T28_PANTALONETA',
              // Polígono asimétrico: base izquierda en x=0, tiro sobresaliendo en x=300
              cutPolygon: [
                { x: 0, y: 0 },
                { x: 250, y: 0 },
                { x: 300, y: 200 }, // Tiro derecho que sobresale
                { x: 250, y: 400 },
                { x: 0, y: 400 },
              ],
              bbox: { minX: 0, minY: 0, maxX: 300, maxY: 400, width: 300, height: 400 },
              areaMm2: 110000,
              allowedRotationsDeg: [0, 180],
              svgPathData: 'M 0 0 L 250 0 L 300 200 L 250 400 L 0 400 Z',
              originalElementId: 'PANTALONETA_T28',
              placeholders: [],
              isAssigned: true,
            },
          ],
        },
      ],
      unassignedPieces: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shortDesign: MasterDesign = {
      id: 'des_short_test',
      name: 'DISEÑO SHORT',
      sport: 'FUTBOL',
      colors: ['#000000', '#ffffff', '#ffd700'],
      pieceArtworks: {
        PANTALONETA_IZQ: {
          pieceType: 'PANTALONETA_IZQ',
          svgArtContent: '<rect width="300" height="400" fill="#111827" />',
          placeholders: [],
        },
        PANTALONETA_DER: {
          pieceType: 'PANTALONETA_DER',
          svgArtContent: '<rect width="300" height="400" fill="#111827" />',
          placeholders: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const playerOrder: OrderItem[] = [
      {
        id: 'ord_short_1',
        rowNumber: 1,
        playerName: 'MATEO',
        playerNumber: '10',
        sizeName: '28',
        garmentType: 'SHORT',
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const result = generateGarmentPieces(playerOrder, singleShortPatternSet, shortDesign);
    expect(result.pieces.length).toBe(2);

    const leftShort = result.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ');
    const rightShort = result.pieces.find((p) => p.pieceType === 'PANTALONETA_DER');

    expect(leftShort).toBeDefined();
    expect(rightShort).toBeDefined();

    // En la pierna izquierda original, el punto más sobresaliente está en X = 300
    const leftMaxX = Math.max(...leftShort!.cutPolygon.map((pt) => pt.x));
    expect(leftMaxX).toBe(300);

    // En la pierna derecha espejada, el punto sobresaliente (300) se invirtió hacia X = 0 (300 - 300 = 0)
    // y el punto original x=0 pasó a X = 300 (300 - 0 = 300)
    const rightPointAtY200 = rightShort!.cutPolygon.find((pt) => Math.abs(pt.y - 200) < 1);
    expect(rightPointAtY200).toBeDefined();
    expect(rightPointAtY200!.x).toBe(0); // Invertido en espejo matemático exacto
  });
});

