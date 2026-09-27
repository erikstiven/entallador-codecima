import { DatabaseService } from '@/core/database/db';
import { MasterDesign, DynamicPlaceholderRule } from './types';
import { PieceType } from '@/core/geometry/types';

/**
 * Guarda o actualiza un diseño maestro en SQLite
 */
export function saveDesignToDb(db: DatabaseService, design: MasterDesign): void {
  const designFilesJson = JSON.stringify(design.pieceArtworks);
  const defaultRulesJson = JSON.stringify({ colors: design.colors });

  db.run(
    `INSERT OR REPLACE INTO designs (id, name, sport, preview_thumbnail, design_files_json, default_rules_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      design.id,
      design.name,
      design.sport,
      design.previewThumbnail || null,
      designFilesJson,
      defaultRulesJson,
    ]
  );
}

/**
 * Recupera todos los diseños maestros de SQLite
 */
export function getDesignsFromDb(db: DatabaseService): MasterDesign[] {
  const rows = db.query<any>('SELECT * FROM designs ORDER BY created_at DESC');
  const results: MasterDesign[] = [];

  for (const r of rows) {
    let pieceArtworks = {};
    let colors = ['#ffffff', '#000000'];

    try { pieceArtworks = JSON.parse(r.design_files_json || '{}'); } catch (_) {}
    try {
      const parsedRules = JSON.parse(r.default_rules_json || '{}');
      if (parsedRules.colors) colors = parsedRules.colors;
    } catch (_) {}

    results.push({
      id: r.id,
      name: r.name,
      sport: r.sport,
      previewThumbnail: r.preview_thumbnail,
      colors,
      pieceArtworks,
      createdAt: r.created_at,
      updatedAt: r.created_at,
    });
  }

  return results;
}

/**
 * Elimina un diseño maestro de SQLite
 */
export function deleteDesignFromDb(db: DatabaseService, designId: string): void {
  db.run('DELETE FROM designs WHERE id = ?', [designId]);
}

/**
 * Reglas estándar de placeholders para una espalda deportiva
 */
export function createDefaultPlaceholderRules(pieceType: PieceType): DynamicPlaceholderRule[] {
  if (pieceType === 'ESPALDA') {
    return [
      {
        id: 'NOMBRE',
        tag: '{{NOMBRE}}',
        targetPiece: 'ESPALDA',
        anchorX: 250, // Centro del ancho ~500mm
        anchorY: 180, // Superior
        maxWidthMm: 280, // 28 cm de ancho máximo
        maxHeightMm: 65,
        defaultFontSizeMm: 55, // 5.5 cm de alto
        minFontSizeMm: 35,
        minScaleFactor: 0.60,
        fontFamily: 'SportsJerseyBold',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidthMm: 2.5,
        textAlign: 'center',
      },
      {
        id: 'NUMERO_ESPALDA',
        tag: '{{NUMERO}}',
        targetPiece: 'ESPALDA',
        anchorX: 250,
        anchorY: 380, // Centro de la espalda
        maxWidthMm: 260,
        maxHeightMm: 260,
        defaultFontSizeMm: 220, // 22 cm de alto reglamentario
        minFontSizeMm: 160,
        minScaleFactor: 0.70,
        fontFamily: 'SportsJerseyBold',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidthMm: 4.0,
        textAlign: 'center',
      },
    ];
  }

  if (pieceType === 'DELANTERO') {
    return [
      {
        id: 'NUMERO_FRENTE',
        tag: '{{NUMERO_FRENTE}}',
        targetPiece: 'DELANTERO',
        anchorX: 350,
        anchorY: 260,
        maxWidthMm: 80,
        maxHeightMm: 80,
        defaultFontSizeMm: 70, // 7 cm número frontal
        minFontSizeMm: 50,
        minScaleFactor: 0.80,
        fontFamily: 'SportsJerseyBold',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidthMm: 1.5,
        textAlign: 'center',
      },
    ];
  }

  return [];
}

export const DEFAULT_SAMPLE_DESIGNS: MasterDesign[] = [
  {
    id: 'des_holanda',
    name: 'Holanda Naranja Clásico',
    sport: 'FUTBOL',
    colors: ['#ea580c', '#0284c7', '#ffffff'],
    pieceArtworks: {
      DELANTERO: {
        pieceType: 'DELANTERO',
        svgArtContent: '<rect width="500" height="700" fill="#ea580c" />',
        placeholders: createDefaultPlaceholderRules('DELANTERO'),
      },
      ESPALDA: {
        pieceType: 'ESPALDA',
        svgArtContent: '<rect width="500" height="700" fill="#ea580c" />',
        placeholders: createDefaultPlaceholderRules('ESPALDA'),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'des_brasil',
    name: 'Brasil Canarinho Oficial',
    sport: 'FUTBOL',
    colors: ['#eab308', '#16a34a', '#1e40af'],
    pieceArtworks: {
      DELANTERO: {
        pieceType: 'DELANTERO',
        svgArtContent: '<rect width="500" height="700" fill="#eab308" />',
        placeholders: createDefaultPlaceholderRules('DELANTERO'),
      },
      ESPALDA: {
        pieceType: 'ESPALDA',
        svgArtContent: '<rect width="500" height="700" fill="#eab308" />',
        placeholders: createDefaultPlaceholderRules('ESPALDA'),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'des_argentina',
    name: 'Argentina Albiceleste Rayas',
    sport: 'FUTBOL',
    colors: ['#38bdf8', '#ffffff', '#000000'],
    pieceArtworks: {
      DELANTERO: {
        pieceType: 'DELANTERO',
        svgArtContent: '<rect width="500" height="700" fill="#38bdf8" />',
        placeholders: createDefaultPlaceholderRules('DELANTERO'),
      },
      ESPALDA: {
        pieceType: 'ESPALDA',
        svgArtContent: '<rect width="500" height="700" fill="#38bdf8" />',
        placeholders: createDefaultPlaceholderRules('ESPALDA'),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Si la base de datos no tiene diseños, sembrar los 4 diseños maestros oficiales
 */
export function seedDefaultMasterDesigns(db: DatabaseService): void {
  const existing = db.query('SELECT id FROM designs LIMIT 1');
  if (existing.length > 0) return;

  for (const d of DEFAULT_SAMPLE_DESIGNS) {
    saveDesignToDb(db, d);
  }
}
