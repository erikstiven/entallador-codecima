import { PlacedNestingPiece } from '@/core/nesting/types';
import { ExportOptions } from './types';
import { Polygon2D } from '@/core/geometry/types';

/**
 * Convierte un array de puntos Polygon2D a una cadena de comando path SVG 'd'
 */
export function polygonToSvgPath(polygon: Polygon2D): string {
  if (!polygon || polygon.length === 0) return '';
  const first = polygon[0];
  let d = `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`;
  for (let i = 1; i < polygon.length; i++) {
    const pt = polygon[i];
    d += ` L ${pt.x.toFixed(3)} ${pt.y.toFixed(3)}`;
  }
  d += ' Z';
  return d;
}

/**
 * Genera un archivo SVG continuo de producción a escala física 1:1 estricta
 * Cumple con los estándares de Illustrator y CorelDRAW:
 * width="1120.00mm" height="3450.00mm" viewBox="0 0 1120.00 3450.00"
 * (1 unidad de dibujo = 1 milímetro exacto)
 */
export function generateFullRollSvg(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {}
): string {
  const includeContour = options.includeCutContour !== false;
  const contourColor = options.cutContourColor || '#ff0000';
  const contourWidth = options.cutContourWidthMm || 0.25; // 0.25 mm ~ 0.7 pt
  const includeLabels = options.includeSeamLabels !== false;

  const wStr = widthMm.toFixed(2);
  const hStr = Math.max(10.0, heightMm).toFixed(2);

  let defsContent = '';
  let piecesContent = '';

  for (const piece of placedPieces) {
    const clipId = `clip_${piece.id}`;
    const pathD = polygonToSvgPath(piece.cutPolygon);

    // Definición de máscara de corte en <defs>
    defsContent += `    <clipPath id="${clipId}">\n`;
    defsContent += `      <path d="${pathD}" />\n`;
    defsContent += `    </clipPath>\n`;

    // Grupo de la pieza con rotación y traslación exacta en mm
    const rot = piece.rotationDeg || 0;
    const transformStr = rot !== 0
      ? `translate(${piece.xMm.toFixed(2)}, ${piece.yMm.toFixed(2)}) rotate(${rot})`
      : `translate(${piece.xMm.toFixed(2)}, ${piece.yMm.toFixed(2)})`;

    piecesContent += `  <!-- Pieza: ${piece.playerName} #${piece.playerNumber} (${piece.pieceType} T${piece.sizeName}) -->\n`;
    piecesContent += `  <g id="piece_${piece.id}" transform="${transformStr}">\n`;

    // Contenido gráfico vectorial o relleno de silueta
    if (piece.svgContent && piece.svgContent.trim().length > 0) {
      piecesContent += `    <g clip-path="url(#${clipId})">\n`;
      // Insertar contenido SVG interno limpio
      piecesContent += `      ${piece.svgContent}\n`;
      piecesContent += `    </g>\n`;
    } else {
      // Representación vectorial por defecto con degradado sutil si no hay arte inyectado
      piecesContent += `    <path d="${pathD}" fill="#1e293b" fill-opacity="0.9" stroke="#38bdf8" stroke-width="0.5" />\n`;
    }

    // Línea de corte exterior para plotters con corte (ej: Mimaki CJV o Roland)
    if (includeContour && pathD) {
      piecesContent += `    <!-- Trazo de corte exterior -->\n`;
      piecesContent += `    <path d="${pathD}" fill="none" stroke="${contourColor}" stroke-width="${contourWidth}" stroke-miterlimit="4" stroke-dasharray="none" />\n`;
    }

    // Etiqueta de identificación para confección en margen de costura
    if (includeLabels) {
      const labelText = `${piece.playerName} | #${piece.playerNumber} | T${piece.sizeName} | ${piece.pieceType}`;
      piecesContent += `    <text x="${(piece.effectiveWidthMm / 2).toFixed(2)}" y="-3.5" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="4.5" font-weight="bold" fill="#0f172a" text-anchor="middle" stroke="#ffffff" stroke-width="0.6" stroke-linejoin="round" paint-order="stroke">${labelText}</text>\n`;
    }

    piecesContent += `  </g>\n\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Generado por HMB Entallador v1.0 - Escala Física 1:1 Estricta (1 unidad = 1 mm) -->
<!-- Dimensiones físicas del rollo: ${wStr} mm x ${hStr} mm -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${wStr}mm"
     height="${hStr}mm"
     viewBox="0 0 ${wStr} ${hStr}"
     version="1.1">
  <defs>
${defsContent}  </defs>

  <!-- Fondo de referencia del rollo -->
  <rect x="0" y="0" width="${wStr}" height="${hStr}" fill="#ffffff" fill-opacity="0.0" />

${piecesContent}</svg>`;
}
