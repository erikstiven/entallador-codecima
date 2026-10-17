import { describe, it, expect, beforeEach } from 'vitest';
import { useGeneratorStore } from './generatorStore';
import { useOrderStore } from '@/modules/orders/orderStore';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { useDesignStore } from '@/modules/designs/designStore';
import { PatternSet } from '@/modules/patterns/types';
import { MasterDesign } from '@/modules/designs/types';

describe('generatorStore - Generación Completa y Auto-Vinculación de Moldes Separados', () => {
  beforeEach(() => {
    useGeneratorStore.getState().clearGenerated();
    useOrderStore.getState().clearOrder();
  });

  it('fusiona automáticamente las pantalonetas de un segundo molde si el molde principal solo tiene camisetas', () => {
    // 1. Molde de Camisetas solamente
    const patternCamisetas: PatternSet = {
      id: 'set_camisetas_2026',
      name: 'MOLDES CAMISETAS 2026',
      garmentType: 'CAMISETA',
      sizes: [
        {
          id: 'sz_t28_c',
          sizeName: '28',
          sortOrder: 1,
          pieces: [
            {
              id: 'p_t28_delantero',
              sizeName: '28',
              pieceType: 'DELANTERO',
              pieceName: 'T28_DELANTERO',
              cutPolygon: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 600 }, { x: 0, y: 600 }],
              bbox: { minX: 0, minY: 0, maxX: 400, maxY: 600, width: 400, height: 600 },
              areaMm2: 240000,
              allowedRotationsDeg: [0],
              svgPathData: 'M 0 0 L 400 0 L 400 600 L 0 600 Z',
              originalElementId: 'p_t28_delantero',
              placeholders: [],
              isAssigned: true,
            },
            {
              id: 'p_t28_espalda',
              sizeName: '28',
              pieceType: 'ESPALDA',
              pieceName: 'T28_ESPALDA',
              cutPolygon: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 620 }, { x: 0, y: 620 }],
              bbox: { minX: 0, minY: 0, maxX: 400, maxY: 620, width: 400, height: 620 },
              areaMm2: 248000,
              allowedRotationsDeg: [0],
              svgPathData: 'M 0 0 L 400 0 L 400 620 L 0 620 Z',
              originalElementId: 'p_t28_espalda',
              placeholders: [],
              isAssigned: true,
            },
            {
              id: 'p_t28_manga_i',
              sizeName: '28',
              pieceType: 'MANGA_IZQ',
              pieceName: 'T28_MANGA_I',
              cutPolygon: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 180 }, { x: 0, y: 180 }],
              bbox: { minX: 0, minY: 0, maxX: 200, maxY: 180, width: 200, height: 180 },
              areaMm2: 36000,
              allowedRotationsDeg: [0, 180],
              svgPathData: 'M 0 0 L 200 0 L 200 180 L 0 180 Z',
              originalElementId: 'p_t28_manga_i',
              placeholders: [],
              isAssigned: true,
            },
            {
              id: 'p_t28_manga_d',
              sizeName: '28',
              pieceType: 'MANGA_DER',
              pieceName: 'T28_MANGA_D',
              cutPolygon: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 180 }, { x: 0, y: 180 }],
              bbox: { minX: 0, minY: 0, maxX: 200, maxY: 180, width: 200, height: 180 },
              areaMm2: 36000,
              allowedRotationsDeg: [0, 180],
              svgPathData: 'M 0 0 L 200 0 L 200 180 L 0 180 Z',
              originalElementId: 'p_t28_manga_d',
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

    // 2. Molde de Pantalonetas separado
    const patternPantalonetas: PatternSet = {
      id: 'set_pantalonetas_2026',
      name: 'MOLDES PANTALONETAS 2026',
      garmentType: 'SHORT',
      sizes: [
        {
          id: 'sz_t28_p',
          sizeName: '28',
          sortOrder: 1,
          pieces: [
            {
              id: 'p_t28_panta_i',
              sizeName: '28',
              pieceType: 'PANTALONETA_IZQ',
              pieceName: 'T28_PANTA_I',
              cutPolygon: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 400 }, { x: 0, y: 400 }],
              bbox: { minX: 0, minY: 0, maxX: 300, maxY: 400, width: 300, height: 400 },
              areaMm2: 120000,
              allowedRotationsDeg: [0, 180],
              svgPathData: 'M 0 0 L 300 0 L 300 400 L 0 400 Z',
              originalElementId: 'p_t28_panta_i',
              placeholders: [],
              isAssigned: true,
            },
            {
              id: 'p_t28_panta_d',
              sizeName: '28',
              pieceType: 'PANTALONETA_DER',
              pieceName: 'T28_PANTA_D',
              cutPolygon: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 400 }, { x: 0, y: 400 }],
              bbox: { minX: 0, minY: 0, maxX: 300, maxY: 400, width: 300, height: 400 },
              areaMm2: 120000,
              allowedRotationsDeg: [0, 180],
              svgPathData: 'M 0 0 L 300 0 L 300 400 L 0 400 Z',
              originalElementId: 'p_t28_panta_d',
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

    usePatternStore.setState({
      patternSets: [patternCamisetas, patternPantalonetas],
      activePatternSet: patternCamisetas,
    });

    const mockDesign: MasterDesign = {
      id: 'des_nuevo_modelo',
      name: 'NUEVO MODELO',
      sport: 'FUTBOL',
      colors: ['#0284c7', '#10b981', '#ffffff'],
      pieceArtworks: {
        DELANTERO: {
          pieceType: 'DELANTERO',
          svgArtContent: '<rect width="500" height="700" fill="#0284c7" />',
          placeholders: [],
        },
        ESPALDA: {
          pieceType: 'ESPALDA',
          svgArtContent: '<rect width="500" height="700" fill="#0284c7" />',
          placeholders: [],
        },
        MANGA_IZQ: {
          pieceType: 'MANGA_IZQ',
          svgArtContent: '<rect width="300" height="300" fill="#10b981" />',
          placeholders: [],
        },
        MANGA_DER: {
          pieceType: 'MANGA_DER',
          svgArtContent: '<rect width="300" height="300" fill="#10b981" />',
          placeholders: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useDesignStore.setState({
      designs: [mockDesign],
      activeDesign: mockDesign,
    });

    useOrderStore.getState().addItem({
      playerName: 'MATEO',
      playerNumber: '10',
      sizeName: '28',
      garmentType: 'COMPLETO',
      quantity: 1,
    });

    // Asegurar alcance ALL
    useGeneratorStore.getState().updateConfig({ productionScope: 'ALL' });
    const res = useGeneratorStore.getState().generatePieces();

    expect(res).not.toBeNull();
    // Debe generar 6 piezas: 4 de camiseta + 2 de pantaloneta
    expect(res!.pieces.length).toBe(6);
    expect(res!.pieces.filter((p) => p.pieceType.startsWith('PANTALONETA')).length).toBe(2);
    expect(res!.pieces.filter((p) => p.pieceType.startsWith('DELANTERO') || p.pieceType === 'ESPALDA' || p.pieceType.startsWith('MANGA')).length).toBe(4);
  });
});
