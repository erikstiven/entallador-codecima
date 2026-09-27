import { describe, it, expect } from 'vitest';
import { extractSvgViewport, parseSvgPathToPolygon } from './svgPathParser';

describe('SVG Path Parser & Viewport Normalizer', () => {
  it('debe extraer el viewport físico en mm de un SVG', () => {
    const svg = '<svg width="1600.00mm" height="1200.00mm" viewBox="0 0 1600 1200"></svg>';
    const vp = extractSvgViewport(svg);

    expect(vp.width).toBe(1600);
    expect(vp.height).toBe(1200);
    expect(vp.scaleX).toBe(1);
    expect(vp.scaleY).toBe(1);
  });

  it('debe calcular escalas proporcionales si viewBox y dimensiones difieren', () => {
    // viewBox de 800x600 px exportado con tamaño físico 1600x1200 mm
    const svg = '<svg width="1600mm" height="1200mm" viewBox="0 0 800 600"></svg>';
    const vp = extractSvgViewport(svg);

    expect(vp.width).toBe(1600);
    expect(vp.height).toBe(1200);
    expect(vp.scaleX).toBe(2);
    expect(vp.scaleY).toBe(2);
  });

  it('debe convertir trazados rectangulares a polígonos cerrados en mm', () => {
    const d = 'M 10 10 L 110 10 L 110 110 L 10 110 Z';
    const polygon = parseSvgPathToPolygon(d, { minX: 0, minY: 0, width: 1000, height: 1000, scaleX: 1, scaleY: 1 });

    expect(polygon.length).toBe(5); // 4 esquinas + cierre Z
    expect(polygon[0]).toEqual({ x: 10, y: 10 });
    expect(polygon[1]).toEqual({ x: 110, y: 10 });
    expect(polygon[2]).toEqual({ x: 110, y: 110 });
    expect(polygon[3]).toEqual({ x: 10, y: 110 });
    expect(polygon[4]).toEqual({ x: 10, y: 10 });
  });

  it('debe interpolar curvas Bézier cúbicas con múltiples muestras suaves', () => {
    // Curva Bézier de (0,0) a (100,0) con puntos de control elevados a Y=50
    const d = 'M 0 0 C 25 50 75 50 100 0 Z';
    const polygon = parseSvgPathToPolygon(d, { minX: 0, minY: 0, width: 1000, height: 1000, scaleX: 1, scaleY: 1 }, 10);

    expect(polygon.length).toBeGreaterThan(10);
    // El punto medio (t=0.5) debe tener Y aproximadamente positiva (elevada)
    const midPoint = polygon[Math.floor(polygon.length / 2)];
    expect(midPoint.y).toBeGreaterThan(10);
  });

  it('debe manejar comandos relativos (m, l, v, h)', () => {
    const d = 'm 50 50 l 50 0 v 50 h -50 z';
    const polygon = parseSvgPathToPolygon(d, { minX: 0, minY: 0, width: 1000, height: 1000, scaleX: 1, scaleY: 1 });

    expect(polygon[0]).toEqual({ x: 50, y: 50 });
    expect(polygon[1]).toEqual({ x: 100, y: 50 });
    expect(polygon[2]).toEqual({ x: 100, y: 100 });
    expect(polygon[3]).toEqual({ x: 50, y: 100 });
  });
});
