import { EpsBoundingBox, EpsValidationResult } from './types';

export const MM_TO_PT_FACTOR = 72.0 / 25.4;

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT_FACTOR;
}

export function ptToMm(pt: number): number {
  return pt / MM_TO_PT_FACTOR;
}

/**
 * Extrae y parsea el BoundingBox o HiResBoundingBox del encabezado EPS.
 */
export function extractBoundingBox(content: string): EpsBoundingBox | null {
  // Primero intentar HiResBoundingBox (mayor precisión en decimales)
  const hiResMatch = content.match(/%%HiResBoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);
  if (hiResMatch) {
    const llx = parseFloat(hiResMatch[1]);
    const lly = parseFloat(hiResMatch[2]);
    const urx = parseFloat(hiResMatch[3]);
    const ury = parseFloat(hiResMatch[4]);
    return {
      llx,
      lly,
      urx,
      ury,
      widthPt: Math.abs(urx - llx),
      heightPt: Math.abs(ury - lly),
      isHiRes: true,
    };
  }

  // Alternativa estándar: BoundingBox entero
  const stdMatch = content.match(/%%BoundingBox:\s*([-\d]+)\s+([-\d]+)\s+([-\d]+)\s+([-\d]+)/i);
  if (stdMatch) {
    const llx = parseInt(stdMatch[1], 10);
    const lly = parseInt(stdMatch[2], 10);
    const urx = parseInt(stdMatch[3], 10);
    const ury = parseInt(stdMatch[4], 10);
    return {
      llx,
      lly,
      urx,
      ury,
      widthPt: Math.abs(urx - llx),
      heightPt: Math.abs(ury - lly),
      isHiRes: false,
    };
  }

  return null;
}

/**
 * Extrae el LanguageLevel de PostScript si está declarado.
 */
export function extractLanguageLevel(content: string): number | undefined {
  const match = content.match(/%%LanguageLevel:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Valida técnicamente un archivo EPS generado.
 */
export function validateEps(
  epsContentOrBuffer: string | Uint8Array,
  expectedDimensionsMm?: { widthMm: number; heightMm: number },
  tolerancePercent = 2.0
): EpsValidationResult {
  const content =
    typeof epsContentOrBuffer === 'string'
      ? epsContentOrBuffer
      : new TextDecoder('utf-8').decode(epsContentOrBuffer.slice(0, 100000)); // leer suficiente para cabecera y estructura

  const fileSizeBytes =
    typeof epsContentOrBuffer === 'string'
      ? Buffer.byteLength(epsContentOrBuffer, 'utf8')
      : epsContentOrBuffer.length;

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verificación de tamaño mínimo
  if (fileSizeBytes < 50) {
    errors.push('El archivo EPS está vacío o tiene un tamaño inferior a 50 bytes.');
    return {
      isValid: false,
      warnings,
      errors,
      fileSizeBytes,
    };
  }

  // 2. Verificación de cabecera PostScript / EPS
  const hasPsHeader = content.startsWith('%!') || content.includes('%!PS-Adobe-');
  const hasEpsHeader = content.includes('EPSF-') || content.includes('EPSF');

  if (!hasPsHeader) {
    errors.push('El archivo no posee una cabecera PostScript válida (%!PS-Adobe-).');
  }

  if (!hasEpsHeader) {
    warnings.push('El archivo no declara explícitamente el identificador EPSF en el encabezado.');
  }

  // 3. Extracción de BoundingBox
  const boundingBox = extractBoundingBox(content);
  if (!boundingBox) {
    errors.push('No se encontró la directiva %%BoundingBox o %%HiResBoundingBox en el archivo EPS.');
  } else if (boundingBox.widthPt <= 0 || boundingBox.heightPt <= 0) {
    errors.push(
      `El BoundingBox reporta dimensiones nulas o negativas (${boundingBox.widthPt}x${boundingBox.heightPt} pt).`
    );
  }

  // 4. Verificación de dimensiones físicas esperadas (si se especificaron)
  if (boundingBox && expectedDimensionsMm && expectedDimensionsMm.widthMm > 0 && expectedDimensionsMm.heightMm > 0) {
    const expectedWidthPt = mmToPt(expectedDimensionsMm.widthMm);
    const expectedHeightPt = mmToPt(expectedDimensionsMm.heightMm);

    const widthDiffPercent = (Math.abs(boundingBox.widthPt - expectedWidthPt) / expectedWidthPt) * 100;
    const heightDiffPercent = (Math.abs(boundingBox.heightPt - expectedHeightPt) / expectedHeightPt) * 100;

    // Si la diferencia excede la tolerancia permitida (ej. 2%), advertir o registrar
    if (widthDiffPercent > tolerancePercent) {
      warnings.push(
        `El ancho del EPS (${ptToMm(boundingBox.widthPt).toFixed(1)} mm) difiere en ${widthDiffPercent.toFixed(1)}% del ancho esperado (${expectedDimensionsMm.widthMm.toFixed(1)} mm).`
      );
    }

    if (heightDiffPercent > tolerancePercent) {
      warnings.push(
        `El alto del EPS (${ptToMm(boundingBox.heightPt).toFixed(1)} mm) difiere en ${heightDiffPercent.toFixed(1)}% del alto esperado (${expectedDimensionsMm.heightMm.toFixed(1)} mm).`
      );
    }
  }

  // 5. Nivel de PostScript
  const postscriptLevel = extractLanguageLevel(content);

  // 6. Terminación correcta
  const hasTrailer = content.includes('%%EOF') || content.includes('showpage') || content.includes('grestore');
  if (!hasTrailer) {
    warnings.push('El archivo no incluye directiva estándar de finalización (%%EOF o showpage).');
  }

  return {
    isValid: errors.length === 0,
    boundingBox: boundingBox || undefined,
    warnings,
    errors,
    fileSizeBytes,
    postscriptLevel,
  };
}
