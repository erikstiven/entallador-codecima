import { Point2D, Polygon2D, BoundingBox, PieceType } from '@/core/geometry/types';

export interface PieceLabelInfo {
  text: string; // ej: "MATEO | #10 | T28 | ESPALDA"
  anchorX: number; // Coordenada X en mm
  anchorY: number; // Coordenada Y en mm
  fontSizeMm: number;
  isVisible: boolean;
}

export interface GeneratedPiece {
  id: string; // ID único para el nesting
  orderItemId: string; // ID del jugador en el pedido
  pieceId: string; // ID del molde original
  playerName: string;
  playerNumber: string;
  sizeName: string;
  pieceType: PieceType;
  pieceName: string; // ej: "MATEO_#10_T28_DELANTERO"
  cutPolygon: Polygon2D; // Polígono cerrado exacto en mm para corte y nesting
  bbox: BoundingBox; // Dimensiones en mm (ancho, alto)
  areaMm2: number; // Área física en mm²
  allowedRotationsDeg: number[]; // [0], [0, 180], etc.
  svgMaskId: string;
  svgContent: string; // SVG completo con clipPath, arte, placeholders vectorizados y etiqueta
  label: PieceLabelInfo;
}

export interface GenerationConfig {
  includeLabels: boolean;
  labelDistanceMm: number; // Separación fuera de la costura (ej: 6 mm)
  labelFontSizeMm: number; // Tamaño de letra de la etiqueta (ej: 5 mm)
  labelColor: string;
}

export interface GenerationResult {
  pieces: GeneratedPiece[];
  totalPieces: number;
  totalGarments: number;
  bySize: Record<string, number>;
  byPieceType: Record<string, number>;
  warnings: string[];
}
