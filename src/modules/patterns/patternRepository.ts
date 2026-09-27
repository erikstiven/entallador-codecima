import { DatabaseService } from '@/core/database/db';
import { PatternSet, PatternSize, PatternPiece } from './types';
import { computeBoundingBox } from '@/core/geometry/transform';

/**
 * Guarda un conjunto completo de moldes con sus tallas y piezas en SQLite
 */
export function savePatternSetToDb(db: DatabaseService, set: PatternSet): void {
  // 1. Insertar o actualizar PatternSet
  db.run(
    `INSERT OR REPLACE INTO pattern_sets (id, name, garment_type, description)
     VALUES (?, ?, ?, ?)`,
    [set.id, set.name, set.garmentType, set.description || '']
  );

  // 2. Limpiar tallas y piezas previas asociadas a este set
  const oldSizes = db.query<{ id: string }>('SELECT id FROM pattern_sizes WHERE pattern_set_id = ?', [set.id]);
  for (const s of oldSizes) {
    db.run('DELETE FROM pattern_pieces WHERE size_id = ?', [s.id]);
  }
  db.run('DELETE FROM pattern_sizes WHERE pattern_set_id = ?', [set.id]);

  // 3. Insertar tallas y piezas
  for (const size of set.sizes) {
    db.run(
      `INSERT INTO pattern_sizes (id, pattern_set_id, size_name, sort_order)
       VALUES (?, ?, ?, ?)`,
      [size.id, set.id, size.sizeName, size.sortOrder]
    );

    for (const piece of size.pieces) {
      db.run(
        `INSERT INTO pattern_pieces (
          id, size_id, piece_type, piece_name, cut_polygon_json, svg_raw_content,
          bbox_width_mm, bbox_height_mm, area_mm2, allowed_rotations_json, placeholders_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          piece.id,
          size.id,
          piece.pieceType,
          piece.pieceName,
          JSON.stringify(piece.cutPolygon),
          piece.svgPathData,
          piece.bbox.width,
          piece.bbox.height,
          piece.areaMm2,
          JSON.stringify(piece.allowedRotationsDeg),
          JSON.stringify(piece.placeholders || []),
        ]
      );
    }
  }
}

/**
 * Recupera todos los conjuntos de moldes almacenados en SQLite
 */
export function getPatternSetsFromDb(db: DatabaseService): PatternSet[] {
  const rows = db.query<any>('SELECT * FROM pattern_sets ORDER BY created_at DESC');
  const results: PatternSet[] = [];

  for (const r of rows) {
    const sizeRows = db.query<any>(
      'SELECT * FROM pattern_sizes WHERE pattern_set_id = ? ORDER BY sort_order ASC',
      [r.id]
    );

    const sizes: PatternSize[] = [];
    for (const s of sizeRows) {
      const pieceRows = db.query<any>(
        'SELECT * FROM pattern_pieces WHERE size_id = ? ORDER BY piece_name ASC',
        [s.id]
      );

      const pieces: PatternPiece[] = pieceRows.map((p) => {
        let cutPolygon = [];
        let allowedRotations = [0];
        let placeholders = [];

        try { cutPolygon = JSON.parse(p.cut_polygon_json); } catch (_) {}
        try { allowedRotations = JSON.parse(p.allowed_rotations_json); } catch (_) {}
        try { placeholders = JSON.parse(p.placeholders_json); } catch (_) {}

        const bbox = cutPolygon.length > 0
          ? computeBoundingBox(cutPolygon)
          : {
              minX: 0,
              minY: 0,
              maxX: p.bbox_width_mm,
              maxY: p.bbox_height_mm,
              width: p.bbox_width_mm,
              height: p.bbox_height_mm,
            };

        return {
          id: p.id,
          sizeName: s.size_name,
          pieceType: p.piece_type,
          pieceName: p.piece_name,
          cutPolygon,
          bbox,
          areaMm2: p.area_mm2,
          allowedRotationsDeg: allowedRotations,
          svgPathData: p.svg_raw_content,
          originalElementId: p.piece_name,
          placeholders,
          isAssigned: true,
        };
      });

      sizes.push({
        id: s.id,
        sizeName: s.size_name,
        sortOrder: s.sort_order,
        pieces,
      });
    }

    results.push({
      id: r.id,
      name: r.name,
      garmentType: r.garment_type,
      description: r.description,
      sizes,
      unassignedPieces: [],
      createdAt: r.created_at,
      updatedAt: r.created_at,
    });
  }

  return results;
}

/**
 * Elimina un conjunto de moldes de SQLite
 */
export function deletePatternSetFromDb(db: DatabaseService, setId: string): void {
  const sizes = db.query<{ id: string }>('SELECT id FROM pattern_sizes WHERE pattern_set_id = ?', [setId]);
  for (const s of sizes) {
    db.run('DELETE FROM pattern_pieces WHERE size_id = ?', [s.id]);
  }
  db.run('DELETE FROM pattern_sizes WHERE pattern_set_id = ?', [setId]);
  db.run('DELETE FROM pattern_sets WHERE id = ?', [setId]);
}
