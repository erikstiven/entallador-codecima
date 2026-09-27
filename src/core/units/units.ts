/**
 * HMB Entallador — Core Units Engine
 * 
 * Este módulo es el corazón de la precisión dimensional 1:1.
 * Todas las medidas internas del sistema se calculan y almacenan en MILÍMETROS (mm).
 * Ninguna transformación matemática debe sufrir desviaciones por resolución de pantalla (DPI/PPI).
 */

export const PT_PER_INCH = 72.0;
export const MM_PER_INCH = 25.4;

// 1 mm = 72 / 25.4 pt = 2.834645669291339 pt
export const MM_TO_PT = PT_PER_INCH / MM_PER_INCH;

// 1 pt = 25.4 / 72 mm = 0.3527777777777778 mm
export const PT_TO_MM = MM_PER_INCH / PT_PER_INCH;

export type SupportedUnit = 'mm' | 'cm' | 'm' | 'in' | 'pt';

/**
 * Convierte cualquier unidad admitida a milímetros (mm)
 */
export function toMm(value: number, unit: SupportedUnit): number {
  if (!Number.isFinite(value)) {
    throw new Error(`toMm: Valor numérico inválido: ${value}`);
  }

  switch (unit) {
    case 'mm':
      return value;
    case 'cm':
      return value * 10.0;
    case 'm':
      return value * 1000.0;
    case 'in':
      return value * MM_PER_INCH;
    case 'pt':
      return value * PT_TO_MM;
    default:
      throw new Error(`toMm: Unidad no soportada: ${unit}`);
  }
}

/**
 * Convierte milímetros a la unidad solicitada
 */
export function fromMm(valueMm: number, targetUnit: SupportedUnit): number {
  if (!Number.isFinite(valueMm)) {
    throw new Error(`fromMm: Valor numérico inválido: ${valueMm}`);
  }

  switch (targetUnit) {
    case 'mm':
      return valueMm;
    case 'cm':
      return valueMm / 10.0;
    case 'm':
      return valueMm / 1000.0;
    case 'in':
      return valueMm / MM_PER_INCH;
    case 'pt':
      return valueMm * MM_TO_PT;
    default:
      throw new Error(`fromMm: Unidad no soportada: ${targetUnit}`);
  }
}

/**
 * Convierte milímetros a puntos tipográficos exactos para PDFs de RasterLink
 */
export function mmToPdfPoints(valueMm: number): number {
  return fromMm(valueMm, 'pt');
}

export const mmToPt = mmToPdfPoints;

/**
 * Convierte puntos tipográficos de PDF a milímetros exactos
 */
export function pdfPointsToMm(valuePt: number): number {
  return toMm(valuePt, 'pt');
}

export const ptToMm = pdfPointsToMm;

/**
 * Parsea un string que incluye valor y unidad (ej. "53.5cm", "1120mm", "14in", "250pt")
 * y retorna el valor equivalente en milímetros exactos.
 */
export function parseUnitStringToMm(input: string): number {
  if (!input || typeof input !== 'string') {
    throw new Error(`parseUnitStringToMm: Entrada inválida: "${input}"`);
  }

  const cleaned = input.trim().toLowerCase();
  
  // Expresión regular para separar número de unidad
  const match = cleaned.match(/^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(mm|cm|m|in|pt|px)?$/);
  
  if (!match) {
    throw new Error(`parseUnitStringToMm: Formato dimensional no reconocido: "${input}"`);
  }

  const numericValue = parseFloat(match[1]);
  const unit = (match[2] as SupportedUnit) || 'mm';

  // Si viene en 'px' (píxeles genéricos de SVG), según estándar W3C SVG 1.1/2:
  // 1 px = 1/96 inch en SVG moderno, o 1/72 inch en DTP clásico.
  // Para evitar errores silenciosos, si es 'px', convertimos asumiendo el estándar SVG moderno 96 DPI.
  if ((match[2] as string) === 'px') {
    return (numericValue / 96.0) * MM_PER_INCH;
  }

  return toMm(numericValue, unit);
}

/**
 * Formatea un valor en milímetros a string con unidades físicas explícitas para SVG
 */
export function formatSvgMm(valueMm: number, decimals: number = 3): string {
  return `${valueMm.toFixed(decimals)}mm`;
}

/**
 * Redondea a N decimales para evitar problemas de acumulación en coma flotante
 */
export function roundTo(value: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Comprueba si dos dimensiones en mm son idénticas dentro de una tolerancia física dada (default: 0.01 mm)
 */
export function areDimensionsEqual(aMm: number, bMm: number, toleranceMm: number = 0.01): boolean {
  return Math.abs(aMm - bMm) <= toleranceMm;
}
