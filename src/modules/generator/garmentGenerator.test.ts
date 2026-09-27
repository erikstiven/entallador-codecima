import { describe, it, expect } from 'vitest';
import { generateGarmentPieces, filterReprintPieces } from './garmentGenerator';
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
    expect(mateoEspalda?.bbox.height).toBe(620);
    expect(mateoEspalda?.svgContent).toContain('MATEO');
    expect(mateoEspalda?.svgContent).toContain('10');
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
});
