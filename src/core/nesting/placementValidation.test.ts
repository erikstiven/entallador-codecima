import { describe, expect, it } from 'vitest';
import { PlacedNestingPiece } from './types';
import { validateManualPlacement } from './placementValidation';

function rectangle(id: string, xMm: number, yMm: number): PlacedNestingPiece {
  return {
    id,
    orderItemId: id,
    pieceId: id,
    playerName: id,
    playerNumber: '1',
    sizeName: 'M',
    pieceType: 'MANGA_IZQ',
    bbox: { width: 100, height: 100 },
    areaMm2: 10000,
    allowedRotations: [0, 90, 180, 270],
    cutPolygon: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
    xMm,
    yMm,
    rotationDeg: 0,
    effectiveWidthMm: 100,
    effectiveHeightMm: 100,
    isLocked: false,
    sheetIndex: 0,
  };
}

describe('validateManualPlacement', () => {
  it('acepta exactamente la separación configurada', () => {
    const fixed = rectangle('fixed', 0, 0);
    const candidate = rectangle('candidate', 103, 0);
    expect(validateManualPlacement(candidate, [fixed, candidate], 1120, 3).valid).toBe(true);
  });

  it('rechaza solapamiento y separación insuficiente', () => {
    const fixed = rectangle('fixed', 0, 0);
    const overlap = rectangle('overlap', 99, 0);
    const tooClose = rectangle('too-close', 102, 0);
    expect(validateManualPlacement(overlap, [fixed, overlap], 1120, 3).reason).toBe('OVERLAP');
    expect(validateManualPlacement(tooClose, [fixed, tooClose], 1120, 3).reason).toBe('SPACING');
  });

  it('rechaza piezas fuera del ancho de bobina', () => {
    const candidate = rectangle('candidate', 1021, 0);
    expect(validateManualPlacement(candidate, [candidate], 1120, 3).reason).toBe('OUT_OF_BOUNDS');
  });
});
