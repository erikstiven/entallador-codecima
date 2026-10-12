import { computeBoundingBox, doPolygonsOverlap, getOrientedPolygon } from '../geometry/transform';
import { Point2D } from '../geometry/types';
import { PlacedNestingPiece } from './types';

export interface PlacementValidationResult {
  valid: boolean;
  reason?: 'OUT_OF_BOUNDS' | 'OVERLAP' | 'SPACING';
  blockingPieceId?: string;
}

function pointToSegmentDistance(point: Point2D, start: Point2D, end: Point2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 0.000001 && Math.abs(dy) < 0.000001) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t = Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
  ));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

export function minimumPolygonDistance(polyA: Point2D[], polyB: Point2D[]): number {
  let minimum = Infinity;
  for (let i = 0; i < polyA.length; i++) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];
    for (let j = 0; j < polyB.length; j++) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length];
      minimum = Math.min(
        minimum,
        pointToSegmentDistance(a1, b1, b2),
        pointToSegmentDistance(a2, b1, b2),
        pointToSegmentDistance(b1, a1, a2),
        pointToSegmentDistance(b2, a1, a2)
      );
      if (minimum <= 0.0001) return 0;
    }
  }
  return minimum;
}

export function getPiecePolygon(piece: PlacedNestingPiece): Point2D[] {
  if (piece.cutPolygon?.length >= 3) {
    return getOrientedPolygon(piece.cutPolygon, piece.rotationDeg, piece.xMm, piece.yMm);
  }
  return [
    { x: piece.xMm, y: piece.yMm },
    { x: piece.xMm + piece.effectiveWidthMm, y: piece.yMm },
    {
      x: piece.xMm + piece.effectiveWidthMm,
      y: piece.yMm + piece.effectiveHeightMm,
    },
    { x: piece.xMm, y: piece.yMm + piece.effectiveHeightMm },
  ];
}

export function validateManualPlacement(
  candidate: PlacedNestingPiece,
  pieces: PlacedNestingPiece[],
  printableWidthMm: number,
  spacingMm: number
): PlacementValidationResult {
  if (candidate.xMm < -0.01
    || candidate.yMm < -0.01
    || candidate.xMm + candidate.effectiveWidthMm > printableWidthMm + 0.01) {
    return { valid: false, reason: 'OUT_OF_BOUNDS' };
  }

  const candidatePolygon = getPiecePolygon(candidate);
  const candidateBox = computeBoundingBox(candidatePolygon);

  for (const other of pieces) {
    if (other.id === candidate.id || (other.sheetIndex ?? 0) !== (candidate.sheetIndex ?? 0)) continue;
    const otherPolygon = getPiecePolygon(other);
    const otherBox = computeBoundingBox(otherPolygon);
    const boxesWithinSpacing = candidateBox.minX < otherBox.maxX + spacingMm
      && candidateBox.maxX + spacingMm > otherBox.minX
      && candidateBox.minY < otherBox.maxY + spacingMm
      && candidateBox.maxY + spacingMm > otherBox.minY;
    if (!boxesWithinSpacing) continue;

    if (doPolygonsOverlap(candidatePolygon, otherPolygon)) {
      return { valid: false, reason: 'OVERLAP', blockingPieceId: other.id };
    }
    if (spacingMm > 0 && minimumPolygonDistance(candidatePolygon, otherPolygon) < spacingMm - 0.01) {
      return { valid: false, reason: 'SPACING', blockingPieceId: other.id };
    }
  }

  return { valid: true };
}
