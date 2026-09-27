import { Point2D, Polygon2D, BoundingBox } from './types';

/**
 * Calcula el Bounding Box exacto (AABB) de un polígono en milímetros
 */
export function computeBoundingBox(polygon: Polygon2D): BoundingBox {
  if (!polygon || polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calcula el área exacta de un polígono usando el método Gauss (Shoelace formula)
 * El resultado está en milímetros cuadrados (mm²)
 */
export function calculatePolygonArea(polygon: Polygon2D): number {
  const n = polygon.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }

  return Math.abs(area) / 2.0;
}

/**
 * Rota un punto 2D en torno a un centro dado en grados (sentido horario estándar)
 */
export function rotatePoint(p: Point2D, angleDeg: number, center: Point2D = { x: 0, y: 0 }): Point2D {
  if (angleDeg % 360 === 0) return { ...p };

  const rad = (angleDeg * Math.PI) / 180.0;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = p.x - center.x;
  const dy = p.y - center.y;

  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
}

/**
 * Aplica traslación a un punto
 */
export function translatePoint(p: Point2D, dxMm: number, dyMm: number): Point2D {
  return {
    x: p.x + dxMm,
    y: p.y + dyMm,
  };
}

/**
 * Transforma un polígono completo (rotación + traslación) respecto a su origen o centro
 */
export function transformPolygon(
  polygon: Polygon2D,
  targetXMm: number,
  targetYMm: number,
  rotationDeg: number = 0,
  pivot: Point2D = { x: 0, y: 0 }
): Polygon2D {
  return polygon.map((p) => {
    const rotated = rotatePoint(p, rotationDeg, pivot);
    return translatePoint(rotated, targetXMm, targetYMm);
  });
}

/**
 * Rota un polígono y normaliza su origen a su Bounding Box mínimo (0, 0),
 * aplicando luego traslación exacta a (targetXMm, targetYMm).
 */
export function getOrientedPolygon(
  polygon: Polygon2D,
  rotationDeg: number,
  targetXMm: number,
  targetYMm: number
): Polygon2D {
  if (rotationDeg === 0) {
    return polygon.map((p) => ({ x: p.x + targetXMm, y: p.y + targetYMm }));
  }

  const rotated = polygon.map((p) => rotatePoint(p, rotationDeg, { x: 0, y: 0 }));
  const bbox = computeBoundingBox(rotated);

  return rotated.map((p) => ({
    x: p.x - bbox.minX + targetXMm,
    y: p.y - bbox.minY + targetYMm,
  }));
}

/**
 * Determina si dos Bounding Boxes se superponen considerando un margen mínimo opcional (en mm)
 */
export function doBoundingBoxesOverlap(
  boxA: BoundingBox,
  boxB: BoundingBox,
  spacingMm: number = 0
): boolean {
  return !(
    boxA.maxX + spacingMm < boxB.minX ||
    boxA.minX - spacingMm > boxB.maxX ||
    boxA.maxY + spacingMm < boxB.minY ||
    boxA.minY - spacingMm > boxB.maxY
  );
}

/**
 * Determina si un punto se encuentra dentro de un polígono cerrado (Ray-Casting Algorithm)
 */
export function isPointInsidePolygon(point: Point2D, polygon: Polygon2D): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
