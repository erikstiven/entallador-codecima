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
  svgContent?: string; // Flyweight: SVG resuelto bajo demanda o vía getter desde pieceSvgRegistry
  label: PieceLabelInfo;
}

export interface GenerationConfig {
  includeLabels: boolean;
  labelDistanceMm: number; // Separación fuera de la costura (ej: 6 mm)
  labelFontSizeMm: number; // Tamaño de letra de la etiqueta (ej: 5 mm)
  labelColor: string;
  includeSizeMark?: boolean; // Imprime la talla dentro de cada pieza
  sizeMarkColor?: string;
  sizeMarkFontSizeMm?: number;
  sizeMarkBottomOffsetMm?: number;
  productionScope?: 'ALL' | 'CAMISETA_ONLY' | 'SHORT_ONLY'; // Permite producir solo camisetas o solo shorts

  // Calibración fina del entallado y dorsal
  nameVerticalOffsetPercent?: number; // Ajuste Y del nombre (-15 a +15%)
  nameScaleX?: number; // Ancho del nombre (0.6 a 1.6, default 1.0)
  nameScaleY?: number; // Alto del nombre (0.6 a 1.6, default 1.0)
  numberVerticalOffsetPercent?: number; // Ajuste Y del número (-15 a +15%)
  numberScaleFactor?: number; // Escala general del número (legacy / alias a scaleY)
  numberScaleX?: number; // Ancho del número (0.6 a 1.6, default 1.0)
  numberScaleY?: number; // Alto del número (0.6 a 1.6, default 1.0)
  sleeveArtOffsetYMm?: number; // Desplazamiento Y del arte de la manga en mm (ej: -15 para alejar de costura)
  frontArtOffsetYMm?: number; // Desplazamiento Y del arte del frente en mm (subir/bajar logos)
  backArtOffsetYMm?: number; // Desplazamiento Y del arte de la espalda en mm
  shortArtOffsetYMm?: number; // Desplazamiento Y del arte de la pantaloneta en mm

  // Personalización dinámica de pantaloneta
  includeShortNumber?: boolean;
  shortNumberPiece?: 'IZQ' | 'DER';
  shortNumberXPercent?: number; // Posición horizontal dentro de la pieza (0-100)
  shortNumberYPercent?: number; // Posición vertical dentro de la pieza (0-100)
  shortNumberScale?: number; // Escala uniforme del número

  // Personalización dinámica de número en delantero (Pecho / Frente de camiseta)
  includeFrontNumber?: boolean;
  frontNumberPosition?: 'CENTRO' | 'DERECHA' | 'IZQUIERDA' | 'CUSTOM';
  frontNumberXPercent?: number; // Posición horizontal dentro del delantero (0-100)
  frontNumberYPercent?: number; // Posición vertical dentro del delantero (0-100)
  frontNumberScale?: number; // Escala uniforme del número frontal (default 1.0)
}

export interface GenerationResult {
  pieces: GeneratedPiece[];
  totalPieces: number;
  totalGarments: number;
  bySize: Record<string, number>;
  byPieceType: Record<string, number>;
  warnings: string[];
}
