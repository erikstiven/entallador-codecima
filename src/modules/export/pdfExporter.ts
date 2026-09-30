import { PDFDocument, PDFName, PDFNumber, rgb, StandardFonts } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

import { PlacedNestingPiece } from '@/core/nesting/types';
import { mmToPt } from '@/core/units/units';
import { getOrientedPolygon } from '@/core/geometry/transform';
import { ExportOptions } from './types';
import { generateFullRollSvg } from './svgExporter';

/**
 * PDF 1.6+ permite páginas mayores a 200 pulgadas mediante /UserUnit. Mantener
 * el MediaBox por debajo de este límite evita que Illustrator/RasterLink recorte
 * rollos largos (por ejemplo, 6.83 m = 19 360 pt).
 */
export const PDF_MAX_USER_SPACE_SIDE_PT = 14_400;

export interface PdfPageGeometry {
  physicalWidthPt: number;
  physicalHeightPt: number;
  mediaBoxWidthPt: number;
  mediaBoxHeightPt: number;
  userUnit: number;
}

export interface PdfPiecePathPlacement {
  path: string;
  /** Traslación PDF previa al cambio de eje Y que realiza drawSvgPath. */
  xPt: number;
  yPt: number;
  /** Puntos en espacio superior-izquierdo, útiles para validar los límites. */
  points: Array<{ x: number; y: number }>;
}

/**
 * Calcula un MediaBox legal y su /UserUnit conservando la medida física 1:1.
 * La relación garantizada es: MediaBox × UserUnit = milímetros × 72 / 25.4.
 */
export function calculatePdfPageGeometry(widthMm: number, heightMm: number): PdfPageGeometry {
  if (!Number.isFinite(widthMm) || widthMm <= 0) {
    throw new Error(`Ancho de bobina inválido para PDF: ${widthMm} mm.`);
  }
  if (!Number.isFinite(heightMm) || heightMm <= 0) {
    throw new Error(`Largo de bobina inválido para PDF: ${heightMm} mm.`);
  }

  const physicalWidthPt = mmToPt(widthMm);
  const physicalHeightPt = mmToPt(Math.max(10, heightMm));
  const longestSidePt = Math.max(physicalWidthPt, physicalHeightPt);

  // Un factor entero produce un /UserUnit sencillo y ampliamente interoperable.
  const userUnit = Math.max(1, Math.ceil(longestSidePt / PDF_MAX_USER_SPACE_SIDE_PT));

  return {
    physicalWidthPt,
    physicalHeightPt,
    mediaBoxWidthPt: physicalWidthPt / userUnit,
    mediaBoxHeightPt: physicalHeightPt / userUnit,
    userUnit,
  };
}

/**
 * Convierte la geometría colocada a un path para pdf-lib. `drawSvgPath` invierte
 * internamente el eje Y; por eso el path conserva Y descendente y se traslada a
 * la altura de página. Invertir Y aquí también dejaría el arte fuera del MediaBox.
 */
export function calculatePdfPiecePathPlacement(
  piece: PlacedNestingPiece,
  geometry: PdfPageGeometry
): PdfPiecePathPlacement | null {
  if (!piece.cutPolygon || piece.cutPolygon.length < 3) return null;

  const coordinateScale = 1 / geometry.userUnit;
  const orientedPolygon = getOrientedPolygon(
    piece.cutPolygon,
    piece.rotationDeg,
    piece.xMm,
    piece.yMm
  );
  const points = orientedPolygon.map((point) => ({
    x: mmToPt(point.x) * coordinateScale,
    y: mmToPt(point.y) * coordinateScale,
  }));

  let path = `M ${points[0].x.toFixed(4)} ${points[0].y.toFixed(4)}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x.toFixed(4)} ${points[i].y.toFixed(4)}`;
  }
  path += ' Z';

  return {
    path,
    xPt: 0,
    yPt: geometry.mediaBoxHeightPt,
    points,
  };
}

/**
 * Construye exactamente el mismo documento gráfico que usa la exportación SVG.
 * El PDF se deriva de esta fuente para impedir divergencias entre formatos.
 */
export function buildPdfSourceSvg(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {}
): string {
  return generateFullRollSvg(placedPieces, widthMm, heightMm, {
    ...options,
    // Salida limpia por defecto. Estos elementos solo se agregan por petición expresa.
    includeCutContour: options.includeCutContour === true,
    includeSeamLabels: options.includeSeamLabels === true,
  });
}

function hasRealArtwork(pieces: PlacedNestingPiece[]): boolean {
  return pieces.some((piece) => Boolean(piece.svgContent?.trim()));
}

function parseProductionSvg(svgSource: string): SVGSVGElement {
  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    throw new Error(
      'PDF_SVG_RENDERER_UNAVAILABLE: la conversión del arte SVG a PDF requiere el navegador de la aplicación.'
    );
  }

  // Los SVG de Illustrator suelen conservar su propia declaración XML/DOCTYPE.
  // Al quedar anidados dentro de cada pieza esas declaraciones ya no son legales;
  // se eliminan sin tocar el contenido gráfico.
  const normalizedSource = svgSource
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?\]>|<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const parsed = new DOMParser().parseFromString(normalizedSource, 'image/svg+xml');
  const parseError = parsed.querySelector('parsererror');
  if (parseError || parsed.documentElement.localName.toLowerCase() !== 'svg') {
    const detail = parseError?.textContent?.trim().slice(0, 180) || 'raíz SVG inválida';
    throw new Error(`PDF_SVG_INVALID: no se pudo interpretar el arte de producción (${detail}).`);
  }

  // El arte se importa desde archivos del usuario. Los elementos ejecutables no
  // forman parte de una pieza imprimible y nunca deben llegar al conversor.
  parsed.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
  parsed.querySelectorAll('*').forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
      if (
        (attribute.name === 'href' || attribute.name === 'xlink:href') &&
        /^\s*javascript:/i.test(attribute.value)
      ) {
        node.removeAttribute(attribute.name);
      }
    }
  });

  return parsed.documentElement as unknown as SVGSVGElement;
}

async function renderArtworkPdf(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions>
): Promise<Uint8Array> {
  const geometry = calculatePdfPageGeometry(widthMm, heightMm);
  const svgSource = buildPdfSourceSvg(placedPieces, widthMm, heightMm, options);
  const svgElement = parseProductionSvg(svgSource);

  // Evita medir el texto antes de que las fuentes ya solicitadas por la interfaz
  // terminen de cargar. Si el navegador no expone FontFaceSet, el conversor sigue
  // usando la cadena de fuentes de respaldo del propio SVG.
  const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fontSet?.ready) {
    await fontSet.ready;
  }

  const orientation = geometry.mediaBoxWidthPt > geometry.mediaBoxHeightPt ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [geometry.mediaBoxWidthPt, geometry.mediaBoxHeightPt],
    userUnit: geometry.userUnit,
    compress: true,
    putOnlyUsedFonts: true,
    floatPrecision: 16,
  });

  // /UserUnit fue incorporado en PDF 1.6. jsPDF lo escribe correctamente,
  // pero conserva 1.3 en el encabezado salvo que se indique de forma expresa.
  const pdfInternals = pdf as jsPDF & {
    __private__?: { setPdfVersion?: (version: string) => void };
  };
  pdfInternals.__private__?.setPdfVersion?.('1.6');

  pdf.setProperties({
    title: `HMB Entallador - Producción ${widthMm}mm x ${heightMm}mm`,
    subject: `Bobina continua 1:1 con ${placedPieces.filter((piece) => piece.svgContent?.trim()).length} piezas de arte SVG`,
    author: 'HMB Entallador',
    creator: 'HMB Entallador - Conversor SVG vectorial',
    keywords: 'HMB, sublimación, RasterLink, SVG, escala 1:1',
  });

  try {
    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: geometry.mediaBoxWidthPt,
      height: geometry.mediaBoxHeightPt,
      loadExternalStyleSheets: false,
      loadImages: true,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `PDF_SVG_RENDER_FAILED: no se pudo conservar el arte completo en el PDF. ${detail}`
    );
  }

  const output = pdf.output('arraybuffer');
  if (!(output instanceof ArrayBuffer) || output.byteLength < 500) {
    throw new Error('PDF_SVG_RENDER_FAILED: el conversor produjo un PDF vacío o incompleto.');
  }

  return new Uint8Array(output);
}

/**
 * Fallback geométrico exclusivo para piezas que realmente no tienen svgContent.
 * Nunca se usa para ocultar un fallo de conversión de arte.
 */
async function renderEmptyArtworkPdf(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions>
): Promise<Uint8Array> {
  const includeContour = options.includeCutContour === true;
  const includeLabels = options.includeSeamLabels === true;
  const geometry = calculatePdfPageGeometry(widthMm, heightMm);
  const coordinateScale = 1 / geometry.userUnit;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`HMB Entallador - Producción ${widthMm}mm x ${heightMm}mm`);
  pdfDoc.setCreator('HMB Entallador - PDF geométrico sin arte');
  pdfDoc.setProducer('HMB Engine for Mimaki RasterLink & Epson Plotters');

  const page = pdfDoc.addPage([geometry.mediaBoxWidthPt, geometry.mediaBoxHeightPt]);
  if (geometry.userUnit > 1) {
    page.node.set(PDFName.of('UserUnit'), PDFNumber.of(geometry.userUnit));
  }

  const font = includeLabels ? await pdfDoc.embedFont(StandardFonts.HelveticaBold) : null;
  const placeholderColor = rgb(0.65, 0.68, 0.72);
  const cutColor = rgb(1, 0, 0);
  const contourWidth = mmToPt(options.cutContourWidthMm || 0.25) * coordinateScale;

  for (const piece of placedPieces) {
    const placement = calculatePdfPiecePathPlacement(piece, geometry);
    if (!placement) continue;

    // Una pieza sin arte se señala como contorno neutro, nunca como relleno oscuro
    // que pueda confundirse con producción imprimible.
    page.drawSvgPath(placement.path, {
      x: placement.xPt,
      y: placement.yPt,
      borderColor: includeContour ? cutColor : placeholderColor,
      borderWidth: includeContour ? contourWidth : 0.25 * coordinateScale,
    });

    if (includeLabels && font) {
      const label = `${piece.playerName} #${piece.playerNumber} | T${piece.sizeName} | ${piece.pieceType}`;
      const fontSize = 8.5 * coordinateScale;
      const textWidth = font.widthOfTextAtSize(label, fontSize);
      const centerX = mmToPt(piece.xMm + piece.effectiveWidthMm / 2) * coordinateScale;
      const y = geometry.mediaBoxHeightPt - mmToPt(piece.yMm) * coordinateScale + 3 * coordinateScale;
      page.drawText(label, {
        x: Math.max(10 * coordinateScale, centerX - textWidth / 2),
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
  }

  return pdfDoc.save();
}

/**
 * Genera una página continua PDF a escala física 1:1.
 *
 * Cuando existe arte, convierte el mismo SVG de producción usado por Illustrator
 * a operadores PDF (paths, imágenes, clips y texto). No sustituye el diseño por
 * siluetas. Si el navegador no puede convertirlo, falla de forma explícita.
 */
export async function generateFullRollPdf(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  if (hasRealArtwork(placedPieces)) {
    return renderArtworkPdf(placedPieces, widthMm, heightMm, options);
  }

  return renderEmptyArtworkPdf(placedPieces, widthMm, heightMm, options);
}
