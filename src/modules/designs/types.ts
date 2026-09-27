import { PieceType } from '@/core/geometry/types';

export interface DynamicPlaceholderRule {
  id: string; // ej: "NOMBRE", "NUMERO_ESPALDA"
  tag: string; // ej: "{{NOMBRE}}", "{{NUMERO}}"
  targetPiece: PieceType; // DELANTERO, ESPALDA, SHORT_FRENTE
  anchorX: number; // Posición X en mm dentro de la pieza
  anchorY: number; // Posición Y en mm dentro de la pieza
  maxWidthMm: number; // Ancho máximo permitido en mm
  maxHeightMm: number; // Alto máximo permitido en mm
  defaultFontSizeMm: number; // Tamaño nominal en mm
  minFontSizeMm: number; // Tamaño mínimo permitido en mm
  minScaleFactor: number; // Factor de compresión mínima (ej. 0.6 = 60%)
  fontFamily: string; // Nombre de la tipografía
  fillColor: string; // Color de relleno (hex)
  strokeColor?: string; // Color de contorno exterior
  strokeWidthMm?: number; // Grosor del contorno en mm
  textAlign: 'center' | 'left' | 'right';
}

export interface PieceArtwork {
  pieceType: PieceType;
  svgArtContent: string; // Código SVG del arte (degradados, escudos, patrocinadores)
  placeholders: DynamicPlaceholderRule[];
}

export interface MasterDesign {
  id: string;
  name: string; // ej: "Holanda Naranja Clásico"
  sport: string; // FUTBOL, BASKET, etc.
  previewThumbnail?: string;
  colors: string[]; // Paleta de colores en hex
  pieceArtworks: Partial<Record<PieceType, PieceArtwork>>;
  createdAt: string;
  updatedAt: string;
}

export interface TextFittingResult {
  text: string;
  fittedWidthMm: number;
  fittedHeightMm: number;
  fontSizeMm: number;
  scaleX: number;
  isCompressed: boolean;
  hasOverflowWarning: boolean;
  warningMessage?: string;
  svgContent: string; // SVG <g> con paths vectorizados
}
