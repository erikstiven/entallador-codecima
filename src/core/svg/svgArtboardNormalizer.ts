/**
 * Normalizador vectorial industrial para piezas textiles (Camisetas, Espaldas, Mangas, Shorts).
 * Elimina mesas de trabajo transparentes, capas de guía y fondos de lienzo exportados
 * desde Adobe Illustrator, CorelDRAW, Inkscape o Figma, y calcula el Bounding Box (BBox)
 * exacto de la prenda para encuadrarla al 100% en el molde y en las vistas previas.
 */

import { parseSvgPathToPolygon } from './svgPathParser';

export interface GarmentBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizeSvgOptions {
  paddingRatio?: number;
  removeArtboards?: boolean;
}

/**
 * Determina si un nodo específico es un artboard, guía o fondo de lienzo de Illustrator/Corel
 */
function isArtboardNode(
  node: SVGElement,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const tag = node.tagName.toLowerCase();
  const id = (node.getAttribute('id') || '').toLowerCase();
  const className = (typeof node.className === 'string' ? node.className : (node.getAttribute('class') || '')).toLowerCase();

  // 1. Identificación por ID o clase explícita
  if (/artboard|mesa|canvas|crop|guide|guia|cuadricula|grid|frame|bounding/i.test(id) ||
      /artboard|mesa|canvas|crop|guide|guia|grid|frame/i.test(className)) {
    return true;
  }

  // 2. Solo rectángulos o polígonos pueden ser fondos de lienzo / mesas de trabajo
  if (tag === 'rect') {
    const fill = (node.getAttribute('fill') || '').toLowerCase();
    const stroke = (node.getAttribute('stroke') || '').toLowerCase();
    const style = (node.getAttribute('style') || '').toLowerCase();

    const isNoneFill = fill === 'none' || fill === 'transparent' || style.includes('fill:none') || style.includes('fill: none');
    const isNoneStroke = !stroke || stroke === 'none' || stroke === 'transparent' || style.includes('stroke:none') || style.includes('stroke: none');

    // Rectángulo completamente transparente/sin trazo
    if (isNoneFill && isNoneStroke) {
      return true;
    }

    // Rectángulo que cubre el 75%+ del lienzo con fondo blanco o transparente
    const rwStr = node.getAttribute('width') || '0';
    const rhStr = node.getAttribute('height') || '0';
    if (rwStr.includes('%') && rhStr.includes('%') && isNoneStroke) {
      return true;
    }

    const rw = parseFloat(rwStr);
    const rh = parseFloat(rhStr);
    if (canvasWidth > 0 && canvasHeight > 0 && rw >= canvasWidth * 0.75 && rh >= canvasHeight * 0.75) {
      const isWhiteOrNeutral = fill === '#ffffff' || fill === '#fff' || fill === 'white' || fill === 'rgb(255, 255, 255)' || isNoneFill;
      const isBgName = /bg|fondo|background|layer_1|capa_1/i.test(id) || /bg|fondo|background/i.test(className);
      if (isWhiteOrNeutral || isBgName) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calcula el Bounding Box exacto de las formas visibles de la prenda dentro de un <svg>
 * SIN destruir ni mutar los elementos visuales reales (paths, grupos, colores, gradientes).
 */
export function extractGarmentBBox(
  svgEl: SVGSVGElement,
  options: { paddingRatio?: number } = {}
): GarmentBBox | null {
  const { paddingRatio = 0 } = options;

  let canvasWidth = 0;
  let canvasHeight = 0;

  const viewBoxAttr = svgEl.getAttribute('viewBox');
  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      canvasWidth = parts[2];
      canvasHeight = parts[3];
    }
  }
  if (!canvasWidth) canvasWidth = parseFloat(svgEl.getAttribute('width') || '0') || 0;
  if (!canvasHeight) canvasHeight = parseFloat(svgEl.getAttribute('height') || '0') || 0;

  // 1. Ocultar temporalmente solo los rectángulos de artboard identificados para medir
  const hiddenArtboardNodes: SVGElement[] = [];
  const allNodes = svgEl.querySelectorAll<SVGElement>('rect, [id*="artboard" i], [id*="mesa" i], [id*="guide" i], [id*="guia" i], [id*="canvas" i]');
  allNodes.forEach((node) => {
    if (isArtboardNode(node, canvasWidth, canvasHeight)) {
      const prevDisplay = node.style.display;
      node.style.display = 'none';
      node.setAttribute('data-hmb-artboard', 'true');
      hiddenArtboardNodes.push(node);
    }
  });

  let foundBBox: GarmentBBox | null = null;

  // 2. Intentar getBBox() nativo del SVG completo (excluyendo artboards ocultos)
  try {
    const rootBbox = svgEl.getBBox();
    if (rootBbox && rootBbox.width > 2 && rootBbox.height > 2 && isFinite(rootBbox.x) && isFinite(rootBbox.y)) {
      const padX = rootBbox.width * paddingRatio;
      const padY = rootBbox.height * paddingRatio;
      foundBBox = {
        x: rootBbox.x - padX,
        y: rootBbox.y - padY,
        width: rootBbox.width + padX * 2,
        height: rootBbox.height + padY * 2,
      };
    }
  } catch (_) {}

  // 3. Fallback: Unión de BBoxes individuales de formas visuales reales
  if (!foundBBox) {
    const renderable = svgEl.querySelectorAll<SVGGraphicsElement>('path, polygon, polyline, circle, ellipse, image, text');
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;

    renderable.forEach((el) => {
      // Ignorar si está dentro de <defs> o clipPath
      if (el.closest('defs, clipPath, mask, pattern')) return;

      try {
        const b = el.getBBox();
        if (b && b.width > 1 && b.height > 1 && isFinite(b.x) && isFinite(b.y)) {
          minX = Math.min(minX, b.x);
          minY = Math.min(minY, b.y);
          maxX = Math.max(maxX, b.x + b.width);
          maxY = Math.max(maxY, b.y + b.height);
          found = true;
        }
      } catch (_) {}
    });

    if (found && maxX > minX && maxY > minY) {
      const rawW = maxX - minX;
      const rawH = maxY - minY;
      const padX = rawW * paddingRatio;
      const padY = rawH * paddingRatio;
      foundBBox = {
        x: minX - padX,
        y: minY - padY,
        width: rawW + padX * 2,
        height: rawH + padY * 2,
      };
    }
  }

  // Restaurar el display de los nodos para no romper el renderizado
  hiddenArtboardNodes.forEach((node) => {
    node.remove(); // En preview y normalización los artboards no deben volver a renderizarse
  });

  return foundBBox;
}

/**
 * Normalización pura basada en cadenas de texto para entornos sin DOM (Node.js / Vitest / Workers)
 */
function normalizeSvgStringHeadless(
  svgContent: string,
  options: NormalizeSvgOptions = {}
): string {
  const { paddingRatio = 0 } = options;

  let cleaned = svgContent
    .replace(/<rect\b[^>]*(?:id=["'][^"']*(?:artboard|mesa|canvas|crop|guide|guia|grid)[^"']*)[^>]*\/?>/gi, '')
    .replace(/<rect\b[^>]*(?:class=["'][^"']*(?:artboard|mesa|canvas|crop|guide|guia)[^"']*)[^>]*\/?>/gi, '')
    .replace(/<rect\b[^>]*fill=["'](?:none|transparent)["'][^>]*stroke=["'](?:none|transparent)["'][^>]*\/?>/gi, '')
    .replace(/<rect\b[^>]*stroke=["'](?:none|transparent)["'][^>]*fill=["'](?:none|transparent)["'][^>]*\/?>/gi, '')
    .replace(/<rect\b[^>]*fill=["'](?:none|transparent)["'](?![^>]*\bstroke=)[^>]*\/?>/gi, '');

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  const pathMatches = cleaned.matchAll(/<path\b[^>]*\bd=["']([^"']+)["']/gi);
  for (const m of pathMatches) {
    const d = m[1];
    const poly = parseSvgPathToPolygon(d);
    for (const pt of poly) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
      found = true;
    }
  }

  const polygonMatches = cleaned.matchAll(/<polygon\b[^>]*\bpoints=["']([^"']+)["']/gi);
  for (const m of polygonMatches) {
    const pointsStr = m[1];
    const coords = pointsStr.trim().split(/[\s,]+/).map(Number);
    for (let i = 0; i < coords.length - 1; i += 2) {
      const x = coords[i];
      const y = coords[i + 1];
      if (isFinite(x) && isFinite(y)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        found = true;
      }
    }
  }

  if (found && maxX > minX && maxY > minY) {
    const rawW = maxX - minX;
    const rawH = maxY - minY;
    const padX = rawW * paddingRatio;
    const padY = rawH * paddingRatio;
    const vx = (minX - padX).toFixed(2);
    const vy = (minY - padY).toFixed(2);
    const vw = (rawW + padX * 2).toFixed(2);
    const vh = (rawH + padY * 2).toFixed(2);

    cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
      const cleanAttrs = attrs.replace(/\bviewBox\s*=\s*["'][^"']+["']/gi, '');
      return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" ${cleanAttrs}>`;
    });
  }

  return cleaned;
}

/**
 * Normaliza un string SVG completo:
 * - Detecta y remueve artboards transparentes y fondos gigantes.
 * - Modifica o añade el atributo viewBox exacto para que el arte textil llene el 100% de su marco.
 */
export function normalizeSvgArtboard(
  svgContent: string,
  options: NormalizeSvgOptions = {}
): string {
  if (!svgContent || !svgContent.includes('<svg')) return svgContent;

  if (typeof document === 'undefined') {
    return normalizeSvgStringHeadless(svgContent, options);
  }

  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '3000px';
    container.style.height = '3000px';
    container.innerHTML = svgContent.trim();
    document.body.appendChild(container);

    const svgEl = container.querySelector('svg');
    if (!svgEl) {
      document.body.removeChild(container);
      return normalizeSvgStringHeadless(svgContent, options);
    }

    const bbox = extractGarmentBBox(svgEl, { paddingRatio: options.paddingRatio ?? 0 });
    if (bbox) {
      const vx = bbox.x.toFixed(2);
      const vy = bbox.y.toFixed(2);
      const vw = bbox.width.toFixed(2);
      const vh = bbox.height.toFixed(2);
      svgEl.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
    }

    const result = svgEl.outerHTML;
    document.body.removeChild(container);
    return result;
  } catch (_) {
    return normalizeSvgStringHeadless(svgContent, options);
  }
}
