import { Point2D, Polygon2D } from '@/core/geometry/types';
import { parseUnitStringToMm } from '@/core/units/units';

export interface SvgViewport {
  minX: number;
  minY: number;
  width: number;
  height: number;
  scaleX: number; // Factor multiplicador a mm
  scaleY: number; // Factor multiplicador a mm
}

/**
 * Extrae y calcula el viewport físico del SVG en milímetros
 */
export function extractSvgViewport(svgString: string): SvgViewport {
  const svgTagMatch = svgString.match(/<svg\b([^>]*)>/i);
  if (!svgTagMatch) {
    return { minX: 0, minY: 0, width: 1000, height: 1000, scaleX: 1, scaleY: 1 };
  }

  const attrs = svgTagMatch[1];

  // Extraer viewBox="minX minY width height"
  const viewBoxMatch = attrs.match(/viewBox\s*=\s*["']\s*([^\s,"']+)\s*[,\s]\s*([^\s,"']+)\s*[,\s]\s*([^\s,"']+)\s*[,\s]\s*([^\s,"']+)\s*["']/i);
  
  let minX = 0;
  let minY = 0;
  let vbWidth = 0;
  let vbHeight = 0;

  if (viewBoxMatch) {
    minX = parseFloat(viewBoxMatch[1]) || 0;
    minY = parseFloat(viewBoxMatch[2]) || 0;
    vbWidth = parseFloat(viewBoxMatch[3]) || 0;
    vbHeight = parseFloat(viewBoxMatch[4]) || 0;
  }

  // Extraer width y height explícitos (ej. width="1120mm" o width="1120px")
  const widthMatch = attrs.match(/\bwidth\s*=\s*["']([^"']+)["']/i);
  const heightMatch = attrs.match(/\bheight\s*=\s*["']([^"']+)["']/i);

  let physicalWidthMm = vbWidth > 0 ? vbWidth : 1000;
  let physicalHeightMm = vbHeight > 0 ? vbHeight : 1000;

  if (widthMatch) {
    try {
      physicalWidthMm = parseUnitStringToMm(widthMatch[1]);
    } catch (_) {}
  } else if (vbWidth > 0) {
    // Si no hay width explícito (ej: exportado directo de Adobe Illustrator sin unidades),
    // las unidades del viewBox están en puntos tipográficos (1 pt = 25.4/72 mm = 0.352778 mm)
    physicalWidthMm = vbWidth * (25.4 / 72.0);
  }

  if (heightMatch) {
    try {
      physicalHeightMm = parseUnitStringToMm(heightMatch[1]);
    } catch (_) {}
  } else if (vbHeight > 0) {
    physicalHeightMm = vbHeight * (25.4 / 72.0);
  }

  if (vbWidth <= 0) vbWidth = physicalWidthMm;
  if (vbHeight <= 0) vbHeight = physicalHeightMm;

  const scaleX = vbWidth > 0 ? physicalWidthMm / vbWidth : 1;
  const scaleY = vbHeight > 0 ? physicalHeightMm / vbHeight : 1;

  return {
    minX,
    minY,
    width: physicalWidthMm,
    height: physicalHeightMm,
    scaleX,
    scaleY,
  };
}

/**
 * Evalúa un punto en una curva Bézier cúbica para un parámetro t en [0, 1]
 */
function cubicBezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Tokeniza una cadena SVG path data en comandos y números
 */
function tokenizePathData(d: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  const regex = /([a-df-z])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/gi;
  let match;

  while ((match = regex.exec(d)) !== null) {
    if (match[1]) {
      tokens.push(match[1]);
    } else if (match[2]) {
      tokens.push(parseFloat(match[2]));
    }
  }

  return tokens;
}

/**
 * Parsea un SVG path (`d="..."`) y lo convierte en un polígono discreto de vértices 2D en mm
 */
export function parseSvgPathToPolygon(
  d: string,
  viewport: SvgViewport = { minX: 0, minY: 0, width: 1000, height: 1000, scaleX: 1, scaleY: 1 },
  samplesPerCurve: number = 10
): Polygon2D {
  const tokens = tokenizePathData(d);
  const rawPoints: Point2D[] = [];

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let currentCmd = '';

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (typeof token === 'string') {
      currentCmd = token;
      i++;
    }

    const isRelative = currentCmd === currentCmd.toLowerCase();
    const cmdUpper = currentCmd.toUpperCase();

    switch (cmdUpper) {
      case 'M': { // Move To
        const x = Number(tokens[i++]);
        const y = Number(tokens[i++]);
        currentX = isRelative ? currentX + x : x;
        currentY = isRelative ? currentY + y : y;
        startX = currentX;
        startY = currentY;
        lastControlX = currentX;
        lastControlY = currentY;
        rawPoints.push({ x: currentX, y: currentY });

        // Si siguen más números sin letra, SVG los interpreta como comandos L / l subsiguientes
        currentCmd = isRelative ? 'l' : 'L';
        break;
      }

      case 'L': { // Line To
        const x = Number(tokens[i++]);
        const y = Number(tokens[i++]);
        currentX = isRelative ? currentX + x : x;
        currentY = isRelative ? currentY + y : y;
        lastControlX = currentX;
        lastControlY = currentY;
        rawPoints.push({ x: currentX, y: currentY });
        break;
      }

      case 'H': { // Horizontal Line
        const x = Number(tokens[i++]);
        currentX = isRelative ? currentX + x : x;
        lastControlX = currentX;
        rawPoints.push({ x: currentX, y: currentY });
        break;
      }

      case 'V': { // Vertical Line
        const y = Number(tokens[i++]);
        currentY = isRelative ? currentY + y : y;
        lastControlY = currentY;
        rawPoints.push({ x: currentX, y: currentY });
        break;
      }

      case 'C': { // Cubic Bézier (x1, y1, x2, y2, x, y)
        const x1 = Number(tokens[i++]);
        const y1 = Number(tokens[i++]);
        const x2 = Number(tokens[i++]);
        const y2 = Number(tokens[i++]);
        const x = Number(tokens[i++]);
        const y = Number(tokens[i++]);

        const p0 = { x: currentX, y: currentY };
        const p1 = { x: isRelative ? currentX + x1 : x1, y: isRelative ? currentY + y1 : y1 };
        const p2 = { x: isRelative ? currentX + x2 : x2, y: isRelative ? currentY + y2 : y2 };
        const p3 = { x: isRelative ? currentX + x : x, y: isRelative ? currentY + y : y };

        for (let s = 1; s <= samplesPerCurve; s++) {
          const t = s / samplesPerCurve;
          rawPoints.push(cubicBezierPoint(p0, p1, p2, p3, t));
        }

        currentX = p3.x;
        currentY = p3.y;
        lastControlX = p2.x;
        lastControlY = p2.y;
        break;
      }

      case 'S': { // Smooth Cubic Bézier (x2, y2, x, y)
        const x2 = Number(tokens[i++]);
        const y2 = Number(tokens[i++]);
        const x = Number(tokens[i++]);
        const y = Number(tokens[i++]);

        // Reflejar el último punto de control
        const p0 = { x: currentX, y: currentY };
        const p1 = {
          x: 2 * currentX - lastControlX,
          y: 2 * currentY - lastControlY,
        };
        const p2 = { x: isRelative ? currentX + x2 : x2, y: isRelative ? currentY + y2 : y2 };
        const p3 = { x: isRelative ? currentX + x : x, y: isRelative ? currentY + y : y };

        for (let s = 1; s <= samplesPerCurve; s++) {
          const t = s / samplesPerCurve;
          rawPoints.push(cubicBezierPoint(p0, p1, p2, p3, t));
        }

        currentX = p3.x;
        currentY = p3.y;
        lastControlX = p2.x;
        lastControlY = p2.y;
        break;
      }

      case 'Z': { // Close Path
        if (currentX !== startX || currentY !== startY) {
          rawPoints.push({ x: startX, y: startY });
          currentX = startX;
          currentY = startY;
        }
        break;
      }

      default:
        // Si no reconocemos un comando poco común (como Arcos elípticos densos), avanzar
        i++;
        break;
    }
  }

  // Normalizar y escalar a milímetros reales según el viewport del SVG
  return rawPoints.map((pt) => ({
    x: (pt.x - viewport.minX) * viewport.scaleX,
    y: (pt.y - viewport.minY) * viewport.scaleY,
  }));
}
