import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PlacedNestingPiece } from '@/core/nesting/types';
import { ExportOptions } from './types';
import { mmToPt } from '@/core/units/units';
import { rotatePoint } from '@/core/geometry/transform';

/**
 * Genera un archivo PDF vectorial continuo a escala física 1:1 estricta
 * Diseñado específicamente para RIPs industriales:
 * - Mimaki RasterLink 6 / 7
 * - Epson Edge Print
 * - Wasatch SoftRIP
 * 
 * Sin escalamiento arbitrario: MediaBox en puntos exactos (1 mm = 72 / 25.4 pt).
 */
export async function generateFullRollPdf(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  const includeContour = options.includeCutContour !== false;
  const includeLabels = options.includeSeamLabels !== false;
  const contourWidthPt = mmToPt(options.cutContourWidthMm || 0.25);

  // Dimensiones físicas exactas en puntos PostScript (MediaBox)
  const widthPt = mmToPt(widthMm);
  const heightPt = mmToPt(Math.max(10.0, heightMm));

  const pdfDoc = await PDFDocument.create();
  
  // Metadatos de producción
  pdfDoc.setTitle(`HMB Entallador - Producción ${widthMm}mm x ${heightMm}mm`);
  pdfDoc.setCreator('HMB Entallador v1.0 - Sublimación Deportiva');
  pdfDoc.setProducer('HMB Engine for Mimaki RasterLink & Epson Plotters');

  // Página continua de bobina
  const page = pdfDoc.addPage([widthPt, heightPt]);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Color de corte (Rojo de corte estándar en RIPs para marcas de registro)
  const cutColor = rgb(1, 0, 0);
  const pieceFillColor = rgb(0.12, 0.16, 0.24); // Tono pizarra oscuro para silueta base
  const pieceBorderColor = rgb(0.22, 0.74, 0.97); // Azul cielo para delimitación
  const labelColor = rgb(0.1, 0.1, 0.1);

  // Dibujar cada pieza colocada
  for (const piece of placedPieces) {
    const rot = piece.rotationDeg || 0;
    const poly = piece.cutPolygon;

    if (!poly || poly.length < 3) continue;

    // Transformar los puntos del polígono a coordenadas globales del rollo en mm
    const transformedPoints = poly.map((pt) => {
      let px = pt.x;
      let py = pt.y;

      if (rot !== 0) {
        // Rotación alrededor del centro de la pieza o su origen
        const rotated = rotatePoint(pt, rot, { x: 0, y: 0 });
        px = rotated.x;
        py = rotated.y;
      }

      return {
        xMm: piece.xMm + px,
        yMm: piece.yMm + py,
      };
    });

    // En PDF el eje Y comienza abajo (0, 0 = esquina inferior izquierda)
    // Convertir mm a puntos en espacio de página PDF:
    // xPt = mmToPt(xMm)
    // yPt = heightPt - mmToPt(yMm)
    const pdfPoints = transformedPoints.map((tp) => ({
      x: mmToPt(tp.xMm),
      y: heightPt - mmToPt(tp.yMm),
    }));

    // Trazar silueta de la pieza con operadores PDF
    // Usamos SVG path syntax o trazado directo mediante operadores nativos
    let pathSvgD = `M ${pdfPoints[0].x.toFixed(2)} ${pdfPoints[0].y.toFixed(2)}`;
    for (let i = 1; i < pdfPoints.length; i++) {
      pathSvgD += ` L ${pdfPoints[i].x.toFixed(2)} ${pdfPoints[i].y.toFixed(2)}`;
    }
    pathSvgD += ' Z';

    try {
      // Dibujar silueta de la pieza
      page.drawSvgPath(pathSvgD, {
        color: pieceFillColor,
        borderColor: pieceBorderColor,
        borderWidth: 0.5,
      });

      // Trazado de corte exterior (CutContour)
      if (includeContour) {
        page.drawSvgPath(pathSvgD, {
          borderColor: cutColor,
          borderWidth: contourWidthPt,
        });
      }
    } catch {
      // Fallback si la sintaxis SVG path es muy compleja
    }

    // Etiqueta de identificación para confección en margen de costura
    if (includeLabels) {
      const labelText = `${piece.playerName} #${piece.playerNumber} | T${piece.sizeName} | ${piece.pieceType}`;
      const fontSize = 8.5; // ~3 mm
      const textWidth = font.widthOfTextAtSize(labelText, fontSize);

      const labelCenterX = mmToPt(piece.xMm + piece.effectiveWidthMm / 2);
      const labelY = heightPt - mmToPt(piece.yMm) + 3; // Ligeramente encima de la costura

      page.drawText(labelText, {
        x: Math.max(10, labelCenterX - textWidth / 2),
        y: labelY,
        size: fontSize,
        font,
        color: labelColor,
      });
    }
  }

  return await pdfDoc.save();
}
