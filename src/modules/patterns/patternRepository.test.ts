import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '@/core/database/db';
import { savePatternSetToDb, getPatternSetsFromDb, deletePatternSetFromDb } from './patternRepository';
import { PatternSet } from './types';

describe('Pattern Repository SQLite Persistence', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService();
    await db.initialize();
  });

  afterEach(() => {
    db.close();
  });

  it('debe persistir y recuperar un conjunto completo de moldes con tallas y piezas en SQLite', () => {
    const mockSet: PatternSet = {
      id: 'set_futbol_2026',
      name: 'MOLDES FUTBOL 2026',
      garmentType: 'FUTBOL',
      description: 'Conjunto de prueba',
      sizes: [
        {
          id: 'size_28',
          sizeName: '28',
          sortOrder: 1,
          pieces: [
            {
              id: 'piece_t28_delantero',
              sizeName: '28',
              pieceType: 'DELANTERO',
              pieceName: 'T28_DELANTERO',
              cutPolygon: [{ x: 0, y: 0 }, { x: 450, y: 0 }, { x: 450, y: 620 }, { x: 0, y: 620 }],
              bbox: { minX: 0, minY: 0, maxX: 450, maxY: 620, width: 450, height: 620 },
              areaMm2: 279000,
              allowedRotationsDeg: [0],
              svgPathData: 'M 0 0 L 450 0 L 450 620 L 0 620 Z',
              originalElementId: 'T28_DELANTERO',
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

    savePatternSetToDb(db, mockSet);

    const retrieved = getPatternSetsFromDb(db);
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].name).toBe('MOLDES FUTBOL 2026');
    expect(retrieved[0].sizes.length).toBe(1);
    expect(retrieved[0].sizes[0].sizeName).toBe('28');
    expect(retrieved[0].sizes[0].pieces.length).toBe(1);

    const piece = retrieved[0].sizes[0].pieces[0];
    expect(piece.pieceType).toBe('DELANTERO');
    expect(piece.bbox.width).toBe(450);
    expect(piece.bbox.height).toBe(620);
    expect(piece.allowedRotationsDeg).toEqual([0]);
  });

  it('debe eliminar un conjunto de moldes y sus tallas/piezas en cascada', () => {
    const mockSet: PatternSet = {
      id: 'set_temp',
      name: 'TEMP SET',
      garmentType: 'BASKET',
      sizes: [
        {
          id: 'size_m',
          sizeName: 'M',
          sortOrder: 1,
          pieces: [
            {
              id: 'p1',
              sizeName: 'M',
              pieceType: 'DELANTERO',
              pieceName: 'M_DELANTERO',
              cutPolygon: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
              bbox: { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 },
              areaMm2: 5000,
              allowedRotationsDeg: [0],
              svgPathData: 'M 0 0 L 100 100 Z',
              originalElementId: 'M_DELANTERO',
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

    savePatternSetToDb(db, mockSet);
    expect(getPatternSetsFromDb(db).length).toBe(1);

    deletePatternSetFromDb(db, 'set_temp');
    expect(getPatternSetsFromDb(db).length).toBe(0);
  });
});
