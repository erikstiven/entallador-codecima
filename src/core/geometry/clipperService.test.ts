import { describe, it, expect } from 'vitest';
import { 
  inflatePolygon, 
  checkPolygonsOverlap, 
  calculatePolygonalIntersectionArea 
} from './clipperService';
import { computeBoundingBox } from './transform';
import { Polygon2D } from './types';

describe('Servicio Geométrico Clipper2 WASM (ClipperService)', () => {
  it('QA 13.1.2: Offset de contorno: un rectángulo de 100x100 mm inflado 7 mm resulta exactamente en 114x114 mm', async () => {
    const square100: Polygon2D = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    const inflatedList = await inflatePolygon(square100, 7.0, 'Square');
    expect(inflatedList.length).toBe(1);

    const inflated = inflatedList[0];
    const bbox = computeBoundingBox(inflated);

    // Dimensiones finales deben ser exactamente 100 + 2*7 = 114 mm
    expect(bbox.width).toBeCloseTo(114.0, 1);
    expect(bbox.height).toBeCloseTo(114.0, 1);
    expect(bbox.minX).toBeCloseTo(-7.0, 1);
    expect(bbox.maxX).toBeCloseTo(107.0, 1);
    expect(bbox.minY).toBeCloseTo(-7.0, 1);
    expect(bbox.maxY).toBeCloseTo(107.0, 1);
  });

  it('QA 13.1.2: Detección de colisión: cero intersección separados por 0.1 mm y colisión positiva al solaparse 0.01 mm', async () => {
    const box1: Polygon2D = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    // Separados por 0.1 mm a la derecha
    const boxSeparated: Polygon2D = [
      { x: 100.1, y: 0 },
      { x: 200.1, y: 0 },
      { x: 200.1, y: 100 },
      { x: 100.1, y: 100 },
    ];

    const overlapSep = await checkPolygonsOverlap(box1, boxSeparated);
    const areaSep = await calculatePolygonalIntersectionArea(box1, boxSeparated);

    expect(overlapSep).toBe(false);
    expect(areaSep).toBe(0.0);

    // Solapados por 0.01 mm
    const boxOverlapping: Polygon2D = [
      { x: 99.99, y: 0 },
      { x: 199.99, y: 0 },
      { x: 199.99, y: 100 },
      { x: 99.99, y: 100 },
    ];

    const overlapTrue = await checkPolygonsOverlap(box1, boxOverlapping);
    const areaTrue = await calculatePolygonalIntersectionArea(box1, boxOverlapping);

    expect(overlapTrue).toBe(true);
    expect(areaTrue).toBeGreaterThan(0.0);
    // 0.01 mm de solapamiento * 100 mm de altura = 1.0 mm²
    expect(areaTrue).toBeCloseTo(1.0, 1);
  });

  it('Intersección poligonal cóncava irregular (simulación de manga deportiva y hueco de costura)', async () => {
    // Polígono en forma de "C" (simula axila cóncava)
    const concaveBody: Polygon2D = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 50 },
      { x: 80, y: 50 },  // Entrada a la concavidad
      { x: 80, y: 150 }, // Fondo de la concavidad
      { x: 200, y: 150 },// Salida de la concavidad
      { x: 200, y: 200 },
      { x: 0, y: 200 },
    ];

    // Pieza pequeña colocada DENTRO de la concavidad sin tocar las paredes
    const pieceInsideCavity: Polygon2D = [
      { x: 90, y: 60 },
      { x: 180, y: 60 },
      { x: 180, y: 140 },
      { x: 90, y: 140 },
    ];

    // Aunque los Bounding Boxes se superponen, los polígonos reales NO se tocan
    const overlaps = await checkPolygonsOverlap(concaveBody, pieceInsideCavity);
    expect(overlaps).toBe(false);

    // Si la pieza se desplaza hacia la izquierda e invade la pared del cuerpo
    const pieceColliding: Polygon2D = [
      { x: 70, y: 60 }, // Invade el cuerpo (x=80)
      { x: 180, y: 60 },
      { x: 180, y: 140 },
      { x: 70, y: 140 },
    ];

    const overlapsColliding = await checkPolygonsOverlap(concaveBody, pieceColliding);
    expect(overlapsColliding).toBe(true);
  });
});
