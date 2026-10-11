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

  it('debe interpretar curvas Bézier cuadráticas (Q / q / T / t) correctamente', () => {
    // Curva cuadrática de (0,0) a (100, 200) con control en (50, 100)
    const d = 'M 0 0 Q 50 100 100 200';
    const polygon = parseSvgPathToPolygon(d, { minX: 0, minY: 0, width: 1000, height: 1000, scaleX: 1, scaleY: 1 }, 10);

    expect(polygon.length).toBe(11);
    const lastPoint = polygon[polygon.length - 1];
    expect(lastPoint.x).toBeCloseTo(100);
    expect(lastPoint.y).toBeCloseTo(200);
  });

  it('debe parsear trazados con comandos q relativos de Illustrator sin truncar la altura', () => {
    // Trazado de espalda talla 40 exportado por Illustrator con comando q
    const d = 'M.61,746.71s135.61,7.07,135.61-184.64V82.54L548.77.64S529.11,86.22,807.51,86.17,1068.09.64,1068.09.64l412.56,81.9V585.4s-12.71,157.29,135.6,161.31v0q-.33,696.63-.22,1393.05c-538.41,0-1075.81-1-1614.22,1C-.24,1675,.78,1211.17.6,745.66Z';
    // Escala Illustrator estándar a mm (72 pt / pulgada = 25.4/72 mm/pt)
    const scale = 25.4 / 72.0;
    const vp = { minX: 0, minY: 0, width: 1616 * scale, height: 2140 * scale, scaleX: scale, scaleY: scale };
    const polygon = parseSvgPathToPolygon(d, vp);

    let maxY = -Infinity;
    for (const p of polygon) {
      if (p.y > maxY) maxY = p.y;
    }
    // La altura máxima debe llegar a ~755 mm (75.5 cm), no truncarse a 452 mm
    expect(maxY).toBeGreaterThan(750);
    expect(maxY).toBeLessThan(760);
  });
});
