import { describe, it, expect } from 'vitest';
import { validateProductionPreflight, calculateExpectedPieces } from './productionPreflight';
import { OrderItem } from '@/modules/orders/types';
import { MasterDesign } from '@/modules/designs/types';
import { PatternSet } from '@/modules/patterns/types';
import { PlacedNestingPiece } from '@/core/nesting/types';

describe('Production Preflight Service (Auditoría Central)', () => {
  const dummyItem: OrderItem = {
    id: 'item_1',
    rowNumber: 1,
    playerName: 'MATEO',
    playerNumber: '10',
    sizeName: '28',
    garmentType: 'COMPLETO',
    necklineType: 'REDONDO',
    quantity: 1,
    isValid: true,
    errors: [],
    warnings: [],
  };

  const dummyDesign: MasterDesign = {
    id: 'des_1',
    name: 'Holanda Clásico',
    sport: 'FUTBOL',
    colors: ['#ea580c', '#ffffff'],
    pieceArtworks: {
      DELANTERO_REDONDO: {
        pieceType: 'DELANTERO_REDONDO',
        svgArtContent: '<rect width="500" height="700" fill="#ea580c" />',
        placeholders: [],
      },
      DELANTERO_V: {
        pieceType: 'DELANTERO_V',
        svgArtContent: '<rect width="500" height="700" fill="#ea580c" />',
        placeholders: [],
      },
      ESPALDA: {
        pieceType: 'ESPALDA',
        svgArtContent: '<rect width="500" height="700" fill="#ea580c" />',
        placeholders: [],
      },
      MANGA_IZQ: {
        pieceType: 'MANGA_IZQ',
        svgArtContent: '<rect width="300" height="300" fill="#ea580c" />',
        placeholders: [],
      },
      MANGA_DER: {
        pieceType: 'MANGA_DER',
        svgArtContent: '<rect width="300" height="300" fill="#ea580c" />',
        placeholders: [],
      },
      PANTALONETA_IZQ: {
        pieceType: 'PANTALONETA_IZQ',
        svgArtContent: '<rect width="400" height="500" fill="#ea580c" />',
        placeholders: [],
      },
      PANTALONETA_DER: {
        pieceType: 'PANTALONETA_DER',
        svgArtContent: '<rect width="400" height="500" fill="#ea580c" />',
        placeholders: [],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const dummyPatternSet: PatternSet = {
    id: 'pat_1',
    name: 'Moldes Pro 2026',
    garmentType: 'FUTBOL',
    sizes: [
      {
        id: 'sz_28',
        sizeName: '28',
        sortOrder: 1,
        pieces: [
          {
            id: 'p1',
            sizeName: '28',
            pieceName: 'DELANTERO_REDONDO_28',
            pieceType: 'DELANTERO_REDONDO',
            cutPolygon: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 500 }, { x: 0, y: 500 }],
            bbox: { minX: 0, minY: 0, maxX: 300, maxY: 500, width: 300, height: 500 },
            areaMm2: 150000,
            allowedRotationsDeg: [0],
            svgPathData: 'M 0 0 L 300 0 L 300 500 L 0 500 Z',
            originalElementId: 'DELANTERO_REDONDO_28',
            placeholders: [],
            isAssigned: true,
          },
          {
            id: 'p2',
            sizeName: '28',
            pieceName: 'ESPALDA_28',
            pieceType: 'ESPALDA',
            cutPolygon: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 500 }, { x: 0, y: 500 }],
            bbox: { minX: 0, minY: 0, maxX: 300, maxY: 500, width: 300, height: 500 },
            areaMm2: 150000,
            allowedRotationsDeg: [0],
            svgPathData: 'M 0 0 L 300 0 L 300 500 L 0 500 Z',
            originalElementId: 'ESPALDA_28',
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

  it('calcula la cantidad esperada de piezas según el tipo de uniforme', () => {
    expect(calculateExpectedPieces([{ ...dummyItem, garmentType: 'CAMISETA' }])).toBe(4);
    expect(calculateExpectedPieces([{ ...dummyItem, garmentType: 'SHORT' }])).toBe(2);
    expect(calculateExpectedPieces([{ ...dummyItem, garmentType: 'COMPLETO' }])).toBe(6);
    expect(calculateExpectedPieces([{ ...dummyItem, garmentType: 'COMPLETO', quantity: 3 }])).toBe(18);
  });

  it('bloquea la generación si el pedido está vacío', () => {
    const result = validateProductionPreflight({
      orderItems: [],
      masterDesign: dummyDesign,
      patternSet: dummyPatternSet,
    });

    expect(result.canProceedToGeneration).toBe(false);
    expect(result.errors.some((e) => e.id === 'ORDER_EMPTY')).toBe(true);
  });

  it('bloquea la producción si falta la talla en el conjunto de moldes (cero sustitución)', () => {
    const orderWithMissingSize: OrderItem[] = [
      {
        ...dummyItem,
        sizeName: 'XXL', // No existe en dummyPatternSet
      },
    ];

    const result = validateProductionPreflight({
      orderItems: orderWithMissingSize,
      masterDesign: dummyDesign,
      patternSet: dummyPatternSet,
    });

    expect(result.canProceedToGeneration).toBe(false);
    expect(result.errors.some((e) => e.id === 'PATTERNS_MISSING_SIZES')).toBe(true);
  });

  it('bloquea la producción si el pedido pide Cuello V pero el diseño solo tiene Cuello Redondo', () => {
    const orderWantsV: OrderItem[] = [
      {
        ...dummyItem,
        necklineType: 'V',
      },
    ];

    const designOnlyRedondo: MasterDesign = {
      ...dummyDesign,
      pieceArtworks: {
        DELANTERO_REDONDO: dummyDesign.pieceArtworks.DELANTERO_REDONDO,
        ESPALDA: dummyDesign.pieceArtworks.ESPALDA,
      },
    };

    const result = validateProductionPreflight({
      orderItems: orderWantsV,
      masterDesign: designOnlyRedondo,
      patternSet: dummyPatternSet,
    });

    expect(result.canProceedToGeneration).toBe(false);
    expect(result.errors.some((e) => e.id === 'DESIGN_MISSING_DELANTERO_V')).toBe(true);
  });

  it('bloquea la exportación si hay piezas que superan el ancho del rollo (1120 mm)', () => {
    const outPiece: PlacedNestingPiece = {
      id: 'p_out',
      orderItemId: 'item_1',
      pieceId: 'p1',
      playerName: 'MATEO',
      playerNumber: '10',
      sizeName: '28',
      pieceType: 'ESPALDA',
      bbox: { width: 500, height: 600 },
      areaMm2: 300000,
      allowedRotations: [0],
      cutPolygon: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 600 }, { x: 0, y: 600 }],
      xMm: 700, // 700 + 500 = 1200 mm > 1120 mm
      yMm: 0,
      rotationDeg: 0,
      effectiveWidthMm: 500,
      effectiveHeightMm: 600,
      isLocked: false,
    };

    const result = validateProductionPreflight({
      orderItems: [dummyItem],
      masterDesign: dummyDesign,
      patternSet: dummyPatternSet,
      generatedPieces: [{ id: 'gen_1' } as any],
      placedPieces: [outPiece],
      rollWidthMm: 1120,
    });

    expect(result.canExport).toBe(false);
    expect(result.errors.some((e) => e.id === 'NESTING_OUT_OF_BOUNDS')).toBe(true);
  });
});
