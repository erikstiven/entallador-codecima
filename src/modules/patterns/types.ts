import { Point2D, Polygon2D, BoundingBox, PieceType, PiecePlaceholder } from '@/core/geometry/types';

export type { PieceType, PiecePlaceholder };

export interface PatternPiece {
  id: string;
  sizeName: string; // ej: "28", "30", "S", "M"
  pieceType: PieceType;
  pieceName: string; // ej: "T28_DELANTERO"
  cutPolygon: Polygon2D; // Polígono cerrado en milímetros (mm)
  bbox: BoundingBox; // Medidas exactas en mm
  areaMm2: number; // Área física en mm²
  allowedRotationsDeg: number[]; // [0], [0, 180], etc.
  svgPathData: string; // Definición Bézier original
  originalElementId: string; // ID original en el SVG/Illustrator
  labelAnchor?: Point2D;
  placeholders: PiecePlaceholder[];
  isAssigned: boolean;
}

export interface PatternSize {
  id: string;
  sizeName: string;
  sortOrder: number;
  pieces: PatternPiece[];
}

export interface PatternSet {
  id: string;
  name: string; // ej: "MOLDES FUTBOL OFICIAL 2026"
  garmentType: string; // "FUTBOL", "BASKET", "CICLISMO", etc.
  description?: string;
  sourceFileName?: string;
  sizes: PatternSize[];
  unassignedPieces: PatternPiece[];
  createdAt: string;
  updatedAt: string;
}

export interface SvgParseResult {
  patternSet: PatternSet;
  warnings: string[];
  totalParsedElements: number;
  unassignedCount: number;
}
