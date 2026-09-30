/**
 * Conversión bidireccional CMYK <-> RGB <-> HEX
 * Calibrado para previsualización e identificación de tintas en sublimación deportiva
 */

export interface CMYK {
  c: number; // 0 - 100 %
  m: number; // 0 - 100 %
  y: number; // 0 - 100 %
  k: number; // 0 - 100 %
}

export interface RGB {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = Math.max(0, Math.min(100, cmyk.c)) / 100;
  const m = Math.max(0, Math.min(100, cmyk.m)) / 100;
  const y = Math.max(0, Math.min(100, cmyk.y)) / 100;
  const k = Math.max(0, Math.min(100, cmyk.k)) / 100;

  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));

  return { r, g, b };
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = Math.max(0, Math.min(255, rgb.r)) / 255;
  const g = Math.max(0, Math.min(255, rgb.g)) / 255;
  const b = Math.max(0, Math.min(255, rgb.b)) / 255;

  const max = Math.max(r, g, b);
  const k = 1 - max;

  if (k >= 0.999) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  const kRound = Math.round(k * 100);

  return {
    c: Math.max(0, Math.min(100, c)),
    m: Math.max(0, Math.min(100, m)),
    y: Math.max(0, Math.min(100, y)),
    k: Math.max(0, Math.min(100, kRound)),
  };
}

export function rgbToHex(rgb: RGB): string {
  const rHex = rgb.r.toString(16).padStart(2, '0');
  const gHex = rgb.g.toString(16).padStart(2, '0');
  const bHex = rgb.b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 0,
      g: parseInt(clean[1] + clean[1], 16) || 0,
      b: parseInt(clean[2] + clean[2], 16) || 0,
    };
  }
  const num = parseInt(clean.substring(0, 6), 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function cmykToHex(cmyk: CMYK): string {
  return rgbToHex(cmykToRgb(cmyk));
}

export function hexToCmyk(hex: string): CMYK {
  return rgbToCmyk(hexToRgb(hex));
}
