import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { usePatternStore } from './patternStore';
import { PatternSet, PatternPiece } from './types';
import { dbService } from '@/core/database/db';

describe('usePatternStore: Duplicado y Modo Espejo de Moldes', () => {
  const sampleShortPiece: PatternPiece = {
    id: 'piece_pantaloneta_t26',
    sizeName: '26',
    pieceType: 'PANTALONETA_IZQ',
    pieceName: 'T26_PANTALONETA',
    cutPolygon: [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 250, y: 350 },
      { x: 50, y: 350 },
    ],
    bbox: { minX: 0, minY: 0, maxX: 250, maxY: 350, width: 250, height: 350 },
    areaMm2: 70000,
    allowedRotationsDeg: [0, 180],
    svgPathData: 'M 0 0 L 200 0 L 250 350 L 50 350 Z',
    originalElementId: 'short_t26',
    placeholders: [],
    isAssigned: true,
  };

  const initialSet: PatternSet = {
    id: 'set_test_patterns',
    name: 'TEST MOLDERIA',
    garmentType: 'FUTBOL',
    sizes: [
      {
        id: 'size_26',
        sizeName: '26',
        sortOrder: 1,
        pieces: [{ ...sampleShortPiece }],
      },
    ],
    unassignedPieces: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    await dbService.initialize();
  });

  beforeEach(() => {
    usePatternStore.setState({
      patternSets: [initialSet],
      activePatternSet: initialSet,
      selectedPieceForAssignment: null,
    });
  });

  it('flipPieceHorizontal voltea las coordenadas del polígono en modo espejo (width - x)', () => {
    const { flipPieceHorizontal } = usePatternStore.getState();

    flipPieceHorizontal('26', 'piece_pantaloneta_t26');

    const active = usePatternStore.getState().activePatternSet;
    expect(active).not.toBeNull();
    const flippedPiece = active!.sizes[0].pieces.find((p) => p.id === 'piece_pantaloneta_t26')!;
    expect(flippedPiece).toBeDefined();

    // width = 250
    // punto 0: x = 0 -> 250 - 0 = 250
    // punto 1: x = 200 -> 250 - 200 = 50
    // punto 2: x = 250 -> 250 - 250 = 0
    // punto 3: x = 50 -> 250 - 50 = 200
    expect(flippedPiece.cutPolygon[0]).toEqual({ x: 250, y: 0 });
    expect(flippedPiece.cutPolygon[1]).toEqual({ x: 50, y: 0 });
    expect(flippedPiece.cutPolygon[2]).toEqual({ x: 0, y: 350 });
    expect(flippedPiece.cutPolygon[3]).toEqual({ x: 200, y: 350 });

    // SVG path actualizado
    expect(flippedPiece.svgPathData).toContain('M 250.00 0.00');
  });

  it('duplicatePieceInSize duplica PANTALONETA_IZQ convirtiéndola y espejándola a PANTALONETA_DER', () => {
    const { duplicatePieceInSize } = usePatternStore.getState();

    duplicatePieceInSize('26', 'piece_pantaloneta_t26');

    const active = usePatternStore.getState().activePatternSet;
    const pieces = active!.sizes[0].pieces;
    expect(pieces.length).toBe(2);

    const original = pieces[0];
    const duplicated = pieces[1];

    expect(original.pieceType).toBe('PANTALONETA_IZQ');
    expect(duplicated.pieceType).toBe('PANTALONETA_DER');
    expect(duplicated.pieceName).toBe('T26_PANTALONETA_DER');
    expect(duplicated.id).not.toBe(original.id);

    // Coordenadas espejadas
    expect(duplicated.cutPolygon[0].x).toBe(250);
    expect(duplicated.cutPolygon[1].x).toBe(50);
  });

  it('duplicatePatternSet clona un molde completo con nombre (COPIA) e IDs únicos', () => {
    const { duplicatePatternSet } = usePatternStore.getState();

    const copy = duplicatePatternSet('set_test_patterns');

    expect(copy).not.toBeNull();
    expect(copy!.name).toBe('TEST MOLDERIA (COPIA)');
    expect(copy!.id).not.toBe('set_test_patterns');
    expect(copy!.sizes.length).toBe(1);
    expect(copy!.sizes[0].pieces.length).toBe(1);
    expect(copy!.sizes[0].pieces[0].id).not.toBe('piece_pantaloneta_t26');
    expect(copy!.sizes[0].pieces[0].pieceType).toBe('PANTALONETA_IZQ');

    const sets = usePatternStore.getState().patternSets;
    expect(sets.length).toBe(2);
    expect(sets.some((s) => s.id === copy!.id)).toBe(true);
  });
});
