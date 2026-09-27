import { Polygon2D, BoundingBox } from '../geometry/types';

export type NestingGroupingMode = 'MAX_SAVINGS' | 'BY_SIZE' | 'BY_PLAYER' | 'BY_PIECE_TYPE';

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
  yMm: number; // Position Y along roll length (0 to totalRollLengthMm)
  rotationDeg: number;
  effectiveWidthMm: number; // bbox width after rotation
  effectiveHeightMm: number; // bbox height after rotation
  isLocked: boolean;
}

export interface NestingOptions {
  printableWidthMm: number; // e.g. 1120 mm
  spacingMm: number; // minimum distance between any two pieces, e.g. 7.0 mm
  groupingMode: NestingGroupingMode;
  allowRotation?: boolean; // whether to allow piece rotations if allowed by piece
}

export interface NestingResult {
  placedPieces: PlacedNestingPiece[];
  totalRollLengthMm: number;
  printableWidthMm: number;
  totalPiecesAreaMm2: number;
  usedRollAreaMm2: number;
  utilizationPercent: number; // 0 to 100 %
  wastePercent: number; // 0 to 100 %
  executionTimeMs: number;
  groupingMode: NestingGroupingMode;
}
