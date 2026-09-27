import { describe, it, expect } from 'vitest';
import {
  toMm,
  fromMm,
  mmToPdfPoints,
  pdfPointsToMm,
  parseUnitStringToMm,
  formatSvgMm,
  roundTo,
  areDimensionsEqual,
  MM_TO_PT,
  PT_TO_MM,
  MM_PER_INCH
} from './units';

describe('Core Units Engine (Escala 1:1 y Conversiones Milimétricas)', () => {
  it('debe mantener las constantes físicas estándar DTP y métricas', () => {
    expect(MM_PER_INCH).toBe(25.4);
    expect(MM_TO_PT).toBeCloseTo(2.834645669, 6);
    expect(PT_TO_MM).toBeCloseTo(0.352777778, 6);
  });

  it('debe convertir correctamente a milímetros desde cm, m, in y pt', () => {
    // 53.5 cm = 535 mm
    expect(toMm(53.5, 'cm')).toBe(535);

    // 1.2 m = 1200 mm
    expect(toMm(1.2, 'm')).toBe(1200);

    // 1 pulgada = 25.4 mm
    expect(toMm(1, 'in')).toBe(25.4);

    // 72 puntos tipográficos = 1 pulgada = 25.4 mm
    expect(toMm(72, 'pt')).toBeCloseTo(25.4, 6);

    // 1 mm = 1 mm
    expect(toMm(100, 'mm')).toBe(100);
  });

  it('debe convertir desde milímetros a las diferentes unidades', () => {
    expect(fromMm(535, 'cm')).toBe(53.5);
    expect(fromMm(1200, 'm')).toBe(1.2);
    expect(fromMm(25.4, 'in')).toBe(1);
    expect(fromMm(25.4, 'pt')).toBeCloseTo(72, 6);
  });

  it('debe garantizar exactitud ida y vuelta (round-trip) sin pérdida de escala', () => {
    const testCases: { value: number; unit: 'cm' | 'in' | 'pt' }[] = [
      { value: 53.5, unit: 'cm' },
      { value: 160, unit: 'cm' },
      { value: 44.25, unit: 'in' },
      { value: 500, unit: 'pt' },
    ];

    for (const tc of testCases) {
      const mm = toMm(tc.value, tc.unit);
      const back = fromMm(mm, tc.unit);
      expect(back).toBeCloseTo(tc.value, 6);
    }
  });

  it('debe calcular puntos para PDF compatibles con RasterLink al 100%', () => {
    // Un rollo de 1120 mm
    const rollWidthMm = 1120.0;
    const rollWidthPt = mmToPdfPoints(rollWidthMm);

    expect(rollWidthPt).toBeCloseTo(3174.803, 2);
    expect(pdfPointsToMm(rollWidthPt)).toBeCloseTo(1120.0, 5);
  });

  it('debe parsear strings dimensionales con unidades diversas', () => {
    expect(parseUnitStringToMm('53.5cm')).toBe(535);
    expect(parseUnitStringToMm('1120 mm')).toBe(1120);
    expect(parseUnitStringToMm('10in')).toBe(254);
    expect(parseUnitStringToMm('72pt')).toBeCloseTo(25.4, 5);
    expect(parseUnitStringToMm('100')).toBe(100); // Asume mm por defecto
  });

  it('debe formatear cadenas SVG con unidades físicas explícitas', () => {
    expect(formatSvgMm(1120)).toBe('1120.000mm');
    expect(formatSvgMm(53.55, 2)).toBe('53.55mm');
  });

  it('debe evaluar correctamente tolerancias geométricas', () => {
    expect(areDimensionsEqual(535.002, 535.000, 0.01)).toBe(true);
    expect(areDimensionsEqual(535.05, 535.000, 0.01)).toBe(false);
  });

  it('debe lanzar error ante entradas no numéricas o unidades inválidas', () => {
    expect(() => toMm(NaN, 'mm')).toThrow();
    expect(() => parseUnitStringToMm('invalido_total')).toThrow();
  });
});
