import { Polygon2D, BoundingBox } from '../geometry/types';

export type NestingGroupingMode = 'MODULAR_PLAYER' | 'PAIRED_SHORTS' | 'MAX_SAVINGS' | 'BY_SIZE' | 'BY_PLAYER' | 'BY_PIECE_TYPE';

export interface NestingPieceInput {
  id: string; // Unique piece ID, e.g. "player_1_DELANTERO"
  orderItemId: string; // Player / item grouping ID
  pieceId: string; // Base pattern piece ID
  playerName: string;
  playerNumber: string;
  sizeName: string;
  pieceType: string;
  bbox: {
    width: number; // in mm
    height: number; // in mm
  };
  areaMm2: number; // in mm²
  allowedRotations: number[]; // e.g. [0] or [0, 180]
  cutPolygon: Polygon2D; // outer cutting boundary in mm
  svgContent?: string;
  
  // Manual edit / lock state
  isLocked?: boolean;
  xMm?: number;
  yMm?: number;
  rotationDeg?: number;
}

export interface PlacedNestingPiece extends NestingPieceInput {
  xMm: number; // Position X relative to roll printable area left edge (0 to printableWidthMm - width)
  yMm: number; // Position Y along roll length (0 to totalRollLengthMm or sheet length)
  rotationDeg: number;
  effectiveWidthMm: number; // bbox width after rotation
  effectiveHeightMm: number; // bbox height after rotation
  isLocked: boolean;
  sheetIndex?: number; // Índice de pliego asignado (0, 1, 2...)
}

export interface NestingOptions {
  printableWidthMm: number; // e.g. 1120 mm (configurable)
  maxSheetLengthMm?: number; // e.g. 5000 mm (5.0 m máximo por archivo)
  spacingMm: number; // minimum distance between any two pieces, e.g. 6.0 mm
  groupingMode: NestingGroupingMode;
  allowRotation?: boolean; // whether to allow piece rotations if allowed by piece
  sideMarginMm?: number; // margen de seguridad lateral izquierdo y derecho (ej. 5.0 mm)
  topMarginMm?: number; // margen de seguridad superior e inferior (ej. 5.0 mm)
  splitByGarmentType?: boolean; // separar camisetas y shorts en pliegos/archivos independientes
}

/**
 * Pliego individual particionado para exportación (ej. PARTE 1, PARTE 2 de máx 500 cm)
 */
export interface NestingSheet {
  id: string;
  sheetNumber: number; // 1, 2, 3...
  garmentType: 'CAMISETA' | 'SHORT' | 'ALL';
  title: string; // ej. "PARTE 1 — Camisetas"
  fileName: string; // ej. "PARTE_1_CAMISETAS_1120x4400mm"
  widthMm: number; // ej. 1120 mm
  heightMm: number; // altura real ocupada (ej. 4400 mm <= maxSheetLengthMm)
  maxHeightMm: number; // límite configurado (ej. 5000 mm)
  placedPieces: PlacedNestingPiece[];
  totalPiecesAreaMm2: number;
  usedAreaMm2: number;
  utilizationPercent: number; // 0 to 100 %
  wastePercent: number;
  playerNames: string[];
  strategyName?: string; // ej. 'BALANCEO_INTELIGENTE_FONDO_MULTICOLUMNA', 'BALANCEO_INTELIGENTE_FONDO_HORIZONTAL', 'FLUJO_MODULAR_CONTINUO'
  bottomFilledCount?: number; // cantidad de piezas reubicadas inteligentemente en la zona inferior para evitar huecos
  savedLengthMm?: number; // milímetros de papel ahorrados frente al apilado lineal simple
}

export interface NestingResult {
  placedPieces: PlacedNestingPiece[];
  sheets?: NestingSheet[]; // Colección de pliegos particionados de máx 500 cm
  activeSheetIndex?: number;
  totalRollLengthMm: number; // Longitud total acumulada
  printableWidthMm: number;
  maxSheetLengthMm?: number;
  totalPiecesAreaMm2: number;
  usedRollAreaMm2: number;
  utilizationPercent: number; // 0 to 100 %
  wastePercent: number; // 0 to 100 %
  executionTimeMs: number;
  groupingMode: NestingGroupingMode;
  strategyName?: string; // ej. 'BALANCEO_INTELIGENTE_FONDO_MULTICOLUMNA', 'BALANCEO_INTELIGENTE_FONDO_HORIZONTAL', 'FLUJO_MODULAR_CONTINUO'
  bottomFilledCount?: number; // cantidad de piezas reubicadas inteligentemente en la zona inferior para evitar huecos
  savedLengthMm?: number; // milímetros de papel ahorrados frente al apilado lineal simple
}
