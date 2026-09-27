/**
 * HMB Entallador — Geometry Types & Data Structures
 * Todas las coordenadas y dimensiones están estrictamente en MILÍMETROS (mm).
 */

export interface Point2D {
  x: number; // Coordenada X en mm
  y: number; // Coordenada Y en mm
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;  // Ancho en mm
  height: number; // Alto en mm
}

export type Polygon2D = Point2D[];

export type PieceType = 
  | 'DELANTERO' 
  | 'ESPALDA' 
  | 'MANGA_IZQ' 
  | 'MANGA_DER' 
  | 'SHORT_FRENTE' 
  | 'SHORT_ESPALDA' 
  | 'CUELLO' 
  | 'OTRO';

export interface PiecePlaceholder {
  id: string; // Ej: "NOMBRE", "NUMERO"
  label: string;
  type: 'text' | 'number' | 'image';
  anchorX: number; // mm
  anchorY: number; // mm
  maxWidthMm: number;
  maxHeightMm: number;
  rotationDeg: number;
  fontFamily: string;
  fontSizeMm: number;
  minFontSizeMm: number;
  fillColor: string;
  strokeColor?: string;
  strokeWidthMm?: number;
  align: 'center' | 'left' | 'right';
}

export interface PatternPieceGeometry {
  id: string;
  sizeName: string; // Ej: "28", "30", "S", "M"
  pieceType: PieceType;
  pieceName: string; // Ej: "T28_DELANTERO"
  cutPolygon: Polygon2D; // Polígono exterior de corte en mm
  bbox: BoundingBox;
  areaMm2: number;
  allowedRotationsDeg: number[]; // Ej: [0] o [0, 180]
  labelAnchor: Point2D;
  placeholders: PiecePlaceholder[];
  svgPathData: string; // Definición Bézier original
}

export interface PlacedPieceItem {
  id: string;
  orderItemId: string; // Referencia al jugador en el Excel
  pieceId: string;     // Referencia al molde
  playerName: string;
  playerNumber: string;
  sizeName: string;
  pieceType: PieceType;
  xMm: number;         // Posición en X en el rollo (mm)
  yMm: number;         // Posición en Y en el rollo (mm)
  rotationDeg: number; // Rotación aplicada (0, 90, 180, 270)
  isLocked: boolean;   // Si está bloqueada manualmente con 🔒
  polygonTransformed: Polygon2D; // Polígono rotado y posicionado
  bboxTransformed: BoundingBox;
}

export interface ProductionProfile {
  id: string;
  name: string;
  totalRollWidthMm: number;  // Ej: 1220 mm
  leftMarginMm: number;      // Ej: 50 mm
  rightMarginMm: number;     // Ej: 50 mm
  printableWidthMm: number;  // totalRollWidthMm - left - right (Ej: 1120 mm)
  pieceSpacingMm: number;    // Separación mínima entre piezas (Ej: 7 mm)
  topMarginMm: number;       // Margen inicial de bobina (Ej: 10 mm)
  bottomMarginMm: number;    // Margen final de bobina (Ej: 10 mm)
}
