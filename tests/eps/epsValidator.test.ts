import { describe, it, expect } from 'vitest';
import {
  validateEps,
  extractBoundingBox,
  extractLanguageLevel,
  mmToPt,
  ptToMm,
} from '../../electron/services/epsValidator';

describe('Servicio epsValidator (Validación Técnica de Archivos EPS)', () => {
  const sampleValidEps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 3175 2013
%%HiResBoundingBox: 0.0000 0.0000 3174.8031 2012.5984
%%Title: CimaPattern Produccion
%%Pages: 1
%%LanguageLevel: 3
%%EndComments
%%Page: 1 1
gsave
1 1 1 setrgbcolor
0 0 3175 2013 rectfill
grestore
showpage
%%Trailer
%%EOF
`;

  it('Convierte milímetros a puntos PostScript y viceversa correctamente', () => {
    // 25.4 mm equivalen exactamente a 72 pt
    expect(mmToPt(25.4)).toBeCloseTo(72.0, 5);
    expect(ptToMm(72.0)).toBeCloseTo(25.4, 5);
  });

  it('Extrae HiResBoundingBox y BoundingBox correctamente de un EPS válido', () => {
    const bbox = extractBoundingBox(sampleValidEps);
    expect(bbox).not.toBeNull();
    expect(bbox!.isHiRes).toBe(true);
    expect(bbox!.widthPt).toBeCloseTo(3174.8031, 3);
    expect(bbox!.heightPt).toBeCloseTo(2012.5984, 3);
  });

  it('Extrae LanguageLevel correctamente', () => {
    const level = extractLanguageLevel(sampleValidEps);
    expect(level).toBe(3);
  });

  it('Valida exitosamente un archivo EPS con dimensiones esperadas', () => {
    // 3174.8031 pt = 1120 mm, 2012.5984 pt = 710 mm
    const result = validateEps(sampleValidEps, { widthMm: 1120, heightMm: 710 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.boundingBox).toBeDefined();
    expect(result.postscriptLevel).toBe(3);
  });

  it('Detecta error si el archivo está vacío o tiene menos de 50 bytes', () => {
    const result = validateEps('corto');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('inferior a 50 bytes'))).toBe(true);
  });

  it('Detecta error si el archivo no contiene cabecera PostScript (%!PS-Adobe-)', () => {
    const invalidHeaderEps = `%%BoundingBox: 0 0 100 100\nTexto cualquiera sin cabecera adecuada de cincuenta caracteres o mas`;
    const result = validateEps(invalidHeaderEps);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('cabecera PostScript'))).toBe(true);
  });

  it('Detecta error si el archivo no declara BoundingBox', () => {
    const noBboxEps = `%!PS-Adobe-3.0 EPSF-3.0
%%Title: Sin bounding box
%%LanguageLevel: 3
%%EndComments
%%EOF
`;
    const result = validateEps(noBboxEps);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('BoundingBox'))).toBe(true);
  });

  it('Genera advertencia si las dimensiones físicas difieren de las esperadas', () => {
    // Esperamos 500 mm pero el EPS tiene 1120 mm
    const result = validateEps(sampleValidEps, { widthMm: 500, heightMm: 710 });
    expect(result.isValid).toBe(true); // Estructuralmente válido
    expect(result.warnings.some((w) => w.includes('difiere'))).toBe(true);
  });
});
