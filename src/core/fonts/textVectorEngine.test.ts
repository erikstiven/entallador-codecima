import { describe, it, expect } from 'vitest';
import { 
  estimateTextWidthMm, 
  computeTextFitting, 
  applyPlaceholdersToArtwork 
} from './textVectorEngine';
import { DynamicPlaceholderRule } from '@/modules/designs/types';

describe('Text Vector Engine & Auto-Fitting Placeholders', () => {
  const baseRule: DynamicPlaceholderRule = {
    id: 'NOMBRE',
    tag: '{{NOMBRE}}',
    targetPiece: 'ESPALDA',
    anchorX: 250,
    anchorY: 180,
    maxWidthMm: 280, // 28 cm máximo
    maxHeightMm: 60,
    defaultFontSizeMm: 55, // 55 mm
    minFontSizeMm: 35,
    minScaleFactor: 0.60, // 60% compresión máxima
    fontFamily: 'SportsJerseyBold',
    fillColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidthMm: 2,
    textAlign: 'center',
  };

  it('debe calcular el ancho natural estimado de un nombre en mm', () => {
    const widthMateo = estimateTextWidthMm('MATEO', 55);
    expect(widthMateo).toBeGreaterThan(150);
    expect(widthMateo).toBeLessThan(250);

    // Un nombre de 11 letras debe medir más que uno de 5
    const widthChristopher = estimateTextWidthMm('CHRISTOPHER', 55);
    expect(widthChristopher).toBeGreaterThan(widthMateo);
  });

  it('debe mantener escala 1.0 (sin compresión) para nombres cortos que entran en el ancho máximo', () => {
    const result = computeTextFitting('CAROL', baseRule);

    expect(result.text).toBe('CAROL');
    expect(result.isCompressed).toBe(false);
    expect(result.scaleX).toBe(1.0);
    expect(result.fontSizeMm).toBe(55);
    expect(result.fittedWidthMm).toBeLessThanOrEqual(baseRule.maxWidthMm);
    expect(result.hasOverflowWarning).toBe(false);
  });

  it('debe comprimir horizontalmente de forma automática nombres largos como "CHRISTOPHER"', () => {
    const result = computeTextFitting('CHRISTOPHER', baseRule);

    expect(result.text).toBe('CHRISTOPHER');
    expect(result.isCompressed).toBe(true);
    expect(result.scaleX).toBeLessThan(1.0); // Se comprimió horizontalmente
    expect(result.scaleX).toBeGreaterThanOrEqual(baseRule.minScaleFactor);
    expect(result.fittedWidthMm).toBeLessThanOrEqual(baseRule.maxWidthMm + 0.1);
    expect(result.hasOverflowWarning).toBe(false);
  });

  it('debe generar advertencia ante nombres extremadamente largos que exceden la compresión máxima', () => {
    const extremeRule = { ...baseRule, maxWidthMm: 120 }; // Ancho muy estrecho
    const result = computeTextFitting('CHRISTOPHER DE LA TORRE', extremeRule);

    expect(result.isCompressed).toBe(true);
    expect(result.hasOverflowWarning).toBe(true);
    expect(result.warningMessage).toContain('supera el ancho máximo');
  });

  it('debe soportar caracteres especiales del idioma español (Á, É, Í, Ó, Ú, Ñ)', () => {
    const result = computeTextFitting('ÍÑIGO PEÑA', baseRule);
    expect(result.text).toBe('ÍÑIGO PEÑA');
    expect(result.svgContent).toContain('ÍÑIGO PEÑA');
  });

  it('debe inyectar placeholders vectoriales en la plantilla SVG del diseño maestro', () => {
    const svgTemplate = '<svg><g id="arte"></g>{{NOMBRE}}{{NUMERO}}</svg>';
    const rules = [
      baseRule,
      {
        id: 'NUMERO_ESPALDA',
        tag: '{{NUMERO}}',
        targetPiece: 'ESPALDA' as const,
        anchorX: 250,
        anchorY: 380,
        maxWidthMm: 250,
        maxHeightMm: 250,
        defaultFontSizeMm: 220,
        minFontSizeMm: 160,
        minScaleFactor: 0.70,
        fontFamily: 'SportsJerseyBold',
        fillColor: '#ffffff',
        textAlign: 'center' as const,
      },
    ];

    const injected = applyPlaceholdersToArtwork(svgTemplate, 'MATEO', '10', rules);

    expect(injected).not.toContain('{{NOMBRE}}');
    expect(injected).not.toContain('{{NUMERO}}');
    expect(injected).toContain('MATEO');
    expect(injected).toContain('10');
  });
});
