import { describe, it, expect } from 'vitest';
import {
  computeBoundingBox,
  calculatePolygonArea,
  rotatePoint,
  translatePoint,
  transformPolygon,
  doBoundingBoxesOverlap,
  isPointInsidePolygon,
} from './transform';
import { Polygon2D } from './types';

describe('Core Geometry Transform Engine', () => {
  it('debe calcular el Bounding Box exacto de un polígono en mm', () => {
    const polygon: Polygon2D = [
      { x: 10, y: 20 },
      { x: 110, y: 20 },
      { x: 110, y: 220 },
      { x: 10, y: 220 },
    ];

    const bbox = computeBoundingBox(polygon);
    expect(bbox.minX).toBe(10);
    expect(bbox.minY).toBe(20);
    expect(bbox.maxX).toBe(110);
    expect(bbox.maxY).toBe(220);
    expect(bbox.width).toBe(100);
    expect(bbox.height).toBe(200);
  });

  it('debe calcular el área de polígonos usando la fórmula Gauss (Shoelace)', () => {
    // Cuadrado de 100x100 mm = 10,000 mm²
    const square: Polygon2D = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(calculatePolygonArea(square)).toBe(10000);

    // Triángulo base 100 mm, altura 50 mm = 2,500 mm²
    const triangle: Polygon2D = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 50 },
    ];
    expect(calculatePolygonArea(triangle)).toBe(2500);
  });

  it('debe rotar puntos 2D en torno al origen con precisión', () => {
    const p = { x: 10, y: 0 };

    const rotated90 = rotatePoint(p, 90);
    expect(rotated90.x).toBeCloseTo(0, 5);
    expect(rotated90.y).toBeCloseTo(10, 5);

    const rotated180 = rotatePoint(p, 180);
    expect(rotated180.x).toBeCloseTo(-10, 5);
    expect(rotated180.y).toBeCloseTo(0, 5);
  });

  it('debe transformar polígonos completos (rotación + traslación)', () => {
    const polygon: Polygon2D = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];

    // Rotar 90° y trasladar a (200, 300) mm
    const transformed = transformPolygon(polygon, 200, 300, 90);
    const bbox = computeBoundingBox(transformed);

    expect(bbox.width).toBeCloseTo(50, 4);
    expect(bbox.height).toBeCloseTo(100, 4);
  });

  it('debe detectar superposición de Bounding Boxes respetando el margen de seguridad', () => {
    const boxA = { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    
    // Separado por 10 mm en X (minX = 110)
    const boxB = { minX: 110, minY: 0, maxX: 210, maxY: 100, width: 100, height: 100 };

    // Sin margen: no se tocan
    expect(doBoundingBoxesOverlap(boxA, boxB, 0)).toBe(false);

    // Con margen de seguridad de 7 mm: distancia es 10 > 7 -> no se tocan
    expect(doBoundingBoxesOverlap(boxA, boxB, 7)).toBe(false);

    // Con margen de seguridad de 12 mm: distancia 10 < 12 -> se consideran en conflicto
    expect(doBoundingBoxesOverlap(boxA, boxB, 12)).toBe(true);
  });

  it('debe comprobar si un punto está dentro de un polígono cerrado', () => {
    const square: Polygon2D = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    expect(isPointInsidePolygon({ x: 50, y: 50 }, square)).toBe(true);
    expect(isPointInsidePolygon({ x: 150, y: 50 }, square)).toBe(false);
  });
});
