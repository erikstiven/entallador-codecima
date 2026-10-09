import { describe, expect, it } from 'vitest';
import { DynamicPlaceholderRule } from '@/modules/designs/types';
import { computeTextFitting } from './textVectorEngine';

const rule: DynamicPlaceholderRule = {
  id: 'NOMBRE',
  tag: '{{NOMBRE}}',
  targetPiece: 'ESPALDA',
  anchorX: 250,
  anchorY: 140,
  maxWidthMm: 300,
  maxHeightMm: 60,
  defaultFontSizeMm: 50,
  minFontSizeMm: 25,
  minScaleFactor: 0.5,
  fontFamily: 'Bebas Neue',
  fillColor: '#ffffff',
  strokeColor: '#000000',
  strokeWidthMm: 2.5,
  textAlign: 'center',
};

describe('SVG text compatibility', () => {
  it('convierte texto a curvas vectoriales <path> nativas cuando la fuente está cargada', () => {
    const fitted = computeTextFitting('CARLOS', rule);

    expect(fitted.svgContent).toContain('<path');
    expect(fitted.svgContent).toContain('d="M');
    expect(fitted.svgContent).toContain('translate(');
    expect(fitted.svgContent).toContain('stroke-width="2.5"');
    expect(fitted.fittedWidthMm).toBeGreaterThan(0);
  });

  it('fija el ancho físico con textLength en modo fallback si la fuente no está cargada', () => {
    const fallbackRule: DynamicPlaceholderRule = {
      ...rule,
      fontFamily: 'NonExistentFontForTestOnly',
    };
    const fitted = computeTextFitting('CARLOS', fallbackRule);
    const textLength = fitted.svgContent.match(/textLength="([^"]+)"/)?.[1];

    expect(Number(textLength)).toBeCloseTo(fitted.fittedWidthMm, 3);
    expect(fitted.svgContent).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(fitted.svgContent).toContain('text-anchor="middle"');
    expect(fitted.svgContent).toContain('translate(250 140)');
  });

  it('aplica realmente la calibración manual horizontal y vertical', () => {
    const normal = computeTextFitting('MATEO', rule);
    const calibrated = computeTextFitting('MATEO', {
      ...rule,
      customScaleX: 1.25,
      customScaleY: 0.8,
    });

    expect(calibrated.fittedWidthMm).toBeCloseTo(normal.fittedWidthMm * 1.25, 5);
    expect(calibrated.fittedHeightMm).toBeCloseTo(normal.fittedHeightMm * 0.8, 5);
    expect(calibrated.svgContent).toContain('0.8)');
  });

  it('genera XML válido con nombres especiales y atributos configurables', () => {
    const fallbackRule: DynamicPlaceholderRule = {
      ...rule,
      fontFamily: `NonExistent' onload='alert(1)`,
    };
    const fitted = computeTextFitting('iñigo & peña <10>', fallbackRule);

    expect(fitted.text).toBe('IÑIGO & PEÑA <10>');
    expect(fitted.svgContent).toContain('IÑIGO &amp; PEÑA &lt;10&gt;');
    expect(fitted.svgContent).not.toContain('onload=');
    expect(fitted.svgContent).toContain('stroke-width="2.5"');
  });
});
