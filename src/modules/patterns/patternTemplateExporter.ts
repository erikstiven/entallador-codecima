import { PatternSet, PatternSize, PatternPiece } from './types';
import { polygonToSvgPath } from '@/core/geometry/transform';

/**
 * Genera un archivo SVG estructurado por capas (CORTE, COSTURA, GUÍAS, ETIQUETAS)
 * listo para abrirse y editarse en Adobe Illustrator o CorelDraw en escala real 1:1 (milímetros).
 */
export function generateIllustratorTemplateSvg(patternSet: PatternSet): string {
  const marginMm = 30;
  let currentX = marginMm;
  let currentY = marginMm;
  let maxHeightInRow = 0;
  const maxRowWidthMm = 2400; // Ancho máximo de mesa de trabajo para ordenar las piezas

  interface PositionedPiece {
    sizeName: string;
    piece: PatternPiece;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const positioned: PositionedPiece[] = [];

  // Recorrer todas las tallas y piezas del molde
  for (const size of patternSet.sizes) {
    for (const piece of size.pieces) {
      const w = piece.bbox.width || 300;
      const h = piece.bbox.height || 400;

      if (currentX + w > maxRowWidthMm && currentX > marginMm) {
        currentX = marginMm;
        currentY += maxHeightInRow + marginMm * 2;
        maxHeightInRow = 0;
      }

      positioned.push({
        sizeName: size.sizeName,
        piece,
        x: currentX,
        y: currentY,
        width: w,
        height: h,
      });

      currentX += w + marginMm;
      if (h > maxHeightInRow) {
        maxHeightInRow = h;
      }
    }
  }

  const totalWidth = Math.max(1000, currentX + marginMm);
  const totalHeight = Math.max(800, currentY + maxHeightInRow + marginMm * 2);

  // Construir capas compatibles con Illustrator
  let guidesLayer = '<g id="GUÍAS_Y_MEDIDAS" opacity="0.85">\n';
  let cutLayer = '<g id="LÍNEA_DE_CORTE" stroke="#0284c7" stroke-width="1.5" fill="none">\n';
  let seamLayer = '<g id="LÍNEA_DE_COSTURA" stroke="#e11d48" stroke-width="1" stroke-dasharray="4,4" fill="none">\n';
  let labelsLayer = '<g id="TEXTOS_Y_REFERENCIAS" fill="#0f172a" font-family="Arial, Helvetica, sans-serif">\n';

  for (const item of positioned) {
    const { sizeName, piece, x, y, width, height } = item;
    const cutPath = polygonToSvgPath(piece.cutPolygon);
    const seamPath = piece.seamPolygon && piece.seamPolygon.length > 0 ? polygonToSvgPath(piece.seamPolygon) : '';

    // Capa de corte
    cutLayer += `  <g id="CORTE_${piece.pieceType}_${sizeName}" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)})">\n`;
    cutLayer += `    <path id="${piece.pieceType}_${sizeName}" data-name="${piece.pieceType}_${sizeName}" d="${cutPath}" />\n`;
    cutLayer += `  </g>\n`;

    // Capa de costura
    if (seamPath) {
      seamLayer += `  <g id="COSTURA_${piece.pieceType}_${sizeName}" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)})">\n`;
      seamLayer += `    <path id="COSTURA_${piece.pieceType}_${sizeName}" data-name="COSTURA_${piece.pieceType}_${sizeName}" d="${seamPath}" />\n`;
      seamLayer += `  </g>\n`;
    }

    // Capa de guías y recuadro técnico
    guidesLayer += `  <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" fill="none" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="2,2" />\n`;

    // Capa de etiquetas informativas
    const labelX = x + 15;
    const labelY = y + 25;
    labelsLayer += `  <text x="${labelX.toFixed(2)}" y="${labelY.toFixed(2)}" font-size="14" font-weight="bold">${piece.pieceName || piece.pieceType} — TALLA ${sizeName}</text>\n`;
    labelsLayer += `  <text x="${labelX.toFixed(2)}" y="${(labelY + 16).toFixed(2)}" font-size="10" fill="#64748b">Dimensión: ${(width / 10).toFixed(1)} cm × ${(height / 10).toFixed(1)} cm (1:1 mm)</text>\n`;
  }

  guidesLayer += '</g>\n';
  cutLayer += '</g>\n';
  seamLayer += '</g>\n';
  labelsLayer += '</g>\n';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm">
  <!-- Plantilla Oficial 1:1 generada por CimaTex para Adobe Illustrator -->
  <!-- Molde: ${patternSet.name} | Total Tallas: ${patternSet.sizes.length} -->
  <defs>
    <style>
      text { font-family: 'Arial', sans-serif; user-select: none; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff" id="FONDO_BLANCO" />
  ${guidesLayer}
  ${cutLayer}
  ${seamLayer}
  ${labelsLayer}
</svg>`;
}
