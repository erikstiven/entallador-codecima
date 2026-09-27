import { describe, it, expect } from 'vitest';
import { calculateSnapping } from './snappingService';
import { PlacedNestingPiece } from '@/core/nesting/types';

function createDummyPlacedPiece(
  id: string,
  xMm: number,
  yMm: number,
  width: number,
  height: number
): PlacedNestingPiece {
  return {
    id,
    orderItemId: 'item1',
    pieceId: 'piece1',
    playerName: 'TEST',
    playerNumber: '1',
    sizeName: 'M',
    pieceType: 'DELANTERO',
    bbox: { width, height },
    areaMm2: width * height * 0.8,
    allowedRotations: [0],
    cutPolygon: [],
    xMm,
    yMm,
    rotationDeg: 0,
    effectiveWidthMm: width,
    effectiveHeightMm: height,
    isLocked: false,
  };
}

describe('Servicio de Snapping Magnético (SnappingService)', () => {
  const printableWidthMm = 1120.0;
  const spacingMm = 7.0;

  it('Atracción al borde izquierdo: una pieza cerca de X=0 (ej: X=4 mm) se imanta exactamente a 0 mm', () => {
    const result = calculateSnapping({
      currentX: 4.0,
      currentY: 100.0,
      widthMm: 500.0,
      heightMm: 700.0,
      printableWidthMm,
      spacingMm,
      otherPieces: [],
      thresholdMm: 15.0,
    });

    expect(result.snappedX).toBe(0.0);
    expect(result.hasSnappedX).toBe(true);
    expect(result.guides.some((g) => g.positionMm === 0)).toBe(true);
  });

  it('Atracción al borde derecho: se imanta a printableWidth - width (1120 - 500 = 620 mm)', () => {
    const result = calculateSnapping({
      currentX: 624.0, // A 4 mm del borde derecho
      currentY: 100.0,
      widthMm: 500.0,
      heightMm: 700.0,
      printableWidthMm,
      spacingMm,
      otherPieces: [],
      thresholdMm: 15.0,
    });

    expect(result.snappedX).toBe(620.0);
    expect(result.hasSnappedX).toBe(true);
  });

  it('Atracción con margen de seguridad de 7.0 mm respecto a otra pieza', () => {
    // Pieza existente colocada en (0, 0) de ancho 500 mm y alto 700 mm
    const pieceA = createDummyPlacedPiece('pA', 0, 0, 500, 700);

    // Arrastramos Pieza B cerca de la derecha de Pieza A: 500 + 7 = 507 mm
    const result = calculateSnapping({
      currentX: 512.0, // A 5 mm de distancia de la posición ideal de 507 mm
      currentY: 0.0,
      widthMm: 450.0,
      heightMm: 700.0,
      printableWidthMm,
      spacingMm,
      otherPieces: [pieceA],
      thresholdMm: 15.0,
    });

    expect(result.snappedX).toBe(507.0); // Exactamente 500 + 7 mm
    expect(result.hasSnappedX).toBe(true);
    expect(result.guides.some((g) => g.label?.includes('7mm'))).toBe(true);
  });

  it('Atracción vertical debajo de otra pieza con margen de seguridad', () => {
    const pieceA = createDummyPlacedPiece('pA', 0, 0, 500, 700);

    // Arrastramos Pieza B debajo de Pieza A: 700 + 7 = 707 mm
    const result = calculateSnapping({
      currentX: 0.0,
      currentY: 712.0, // A 5 mm de 707 mm
      widthMm: 500.0,
      heightMm: 600.0,
      printableWidthMm,
      spacingMm,
      otherPieces: [pieceA],
      thresholdMm: 15.0,
    });

    expect(result.snappedY).toBe(707.0);
    expect(result.hasSnappedY).toBe(true);
  });

  it('Fuera de tolerancia de atracción: no modifica las coordenadas', () => {
    const result = calculateSnapping({
      currentX: 250.0,
      currentY: 400.0,
      widthMm: 500.0,
      heightMm: 600.0,
      printableWidthMm,
      spacingMm,
      otherPieces: [],
      thresholdMm: 15.0,
    });

    expect(result.snappedX).toBe(250.0);
    expect(result.snappedY).toBe(400.0);
    expect(result.hasSnappedX).toBe(false);
    expect(result.hasSnappedY).toBe(false);
    expect(result.guides.length).toBe(0);
  });
});
