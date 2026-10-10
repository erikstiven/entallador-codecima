import { PlacedNestingPiece } from '@/core/nesting/types';
import { ExportOptions } from './types';
import { mmToPt } from '@/core/units/units';
import { rotatePoint } from '@/core/geometry/transform';
import { generateFullRollSvg } from './svgExporter';
import { convertSvgToEpsClient, EpsConversionOptions } from './epsConversionClient';

/**
 * Convierte el SVG maestro de producción a EPS Level 3 completo de alta fidelidad
 * utilizando el motor aislado Inkscape CLI a través de Electron.
 */
export async function generateFullRollEpsWithInkscape(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {},
  conversionOptions: EpsConversionOptions = {}
): Promise<string> {
  // 1. Obtener el SVG maestro existente como única fuente de verdad (sin alterarlo)
  const masterSvg = generateFullRollSvg(placedPieces, widthMm, heightMm, options);

  // 2. Ejecutar conversión mediante el cliente IPC seguro de Electron
  const result = await convertSvgToEpsClient(
    masterSvg,
    {
      dpi: conversionOptions.dpi || 300,
      postscriptLevel: conversionOptions.postscriptLevel || 3,
      convertTextToPaths: conversionOptions.convertTextToPaths !== false,
      timeoutMs: conversionOptions.timeoutMs,
      customInkscapePath: conversionOptions.customInkscapePath,
    },
    {
      widthMm,
      heightMm,
    }
  );

  if (!result.success || !result.epsContent) {
    throw new Error(
      result.error ||
        'No se pudo generar el archivo EPS mediante Inkscape CLI. Verifique la instalación del motor.'
    );
  }

  return result.epsContent;
}

/**
 * Generador PostScript estático directo (fallback para entornos sin Inkscape o tests unitarios)
 */
export function generateFullRollEps(
  placedPieces: PlacedNestingPiece[],
  widthMm: number,
  heightMm: number,
  options: Partial<ExportOptions> = {}
): string {
  // Las guías visibles son opt-in: nunca deben aparecer por omitir opciones.
  const includeContour = options.includeCutContour === true;
  const includeLabels = options.includeSeamLabels === true;
  const contourWidthPt = mmToPt(options.cutContourWidthMm || 0.25).toFixed(3);

  const widthPt = mmToPt(widthMm);
  const heightPt = mmToPt(Math.max(10.0, heightMm));

  const bbW = Math.ceil(widthPt);
  const bbH = Math.ceil(heightPt);

  let ps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${bbW} ${bbH}
%%HiResBoundingBox: 0.0000 0.0000 ${widthPt.toFixed(4)} ${heightPt.toFixed(4)}
%%Title: HMB Entallador - Produccion Textil 1:1
%%Creator: HMB Entallador v1.0
%%CreationDate: ${new Date().toISOString()}
%%Pages: 1
%%DocumentData: Clean7Bit
%%LanguageLevel: 3
%%EndComments

%%BeginProlog
/m { moveto } bind def
/l { lineto } bind def
/cp { closepath } bind def
/rgb { setrgbcolor } bind def
/lw { setlinewidth } bind def
%%EndProlog

%%Page: 1 1
gsave

% Fondo blanco de la bobina
1.0 1.0 1.0 rgb
0 0 ${widthPt.toFixed(2)} ${heightPt.toFixed(2)} rectfill
`;

  for (const piece of placedPieces) {
    const rot = piece.rotationDeg || 0;
    const poly = piece.cutPolygon;
    if (!poly || poly.length < 3) continue;

    const transformed = poly.map((pt) => {
      let px = pt.x;
      let py = pt.y;
      if (rot !== 0) {
        const r = rotatePoint(pt, rot, { x: 0, y: 0 });
        px = r.x;
        py = r.y;
      }
      return {
        xPt: mmToPt(piece.xMm + px),
        yPt: heightPt - mmToPt(piece.yMm + py),
      };
    });

    // Trazar silueta con fondo claro
    ps += `\n% Pieza: ${piece.playerName} #${piece.playerNumber} (${piece.pieceType})\n`;
    ps += `newpath\n`;
    ps += `${transformed[0].xPt.toFixed(2)} ${transformed[0].yPt.toFixed(2)} m\n`;
    for (let i = 1; i < transformed.length; i++) {
      ps += `${transformed[i].xPt.toFixed(2)} ${transformed[i].yPt.toFixed(2)} l\n`;
    }
    ps += `cp\n`;
    // Relleno suave amarillo/dorado textil si es camiseta
    ps += `0.98 0.88 0.35 rgb fill\n`;

    // Trazo de corte CutContour en rojo puro (1 0 0 rgb)
    if (includeContour) {
      ps += `newpath\n`;
      ps += `${transformed[0].xPt.toFixed(2)} ${transformed[0].yPt.toFixed(2)} m\n`;
      for (let i = 1; i < transformed.length; i++) {
        ps += `${transformed[i].xPt.toFixed(2)} ${transformed[i].yPt.toFixed(2)} l\n`;
      }
      ps += `cp\n`;
      ps += `${contourWidthPt} lw 1.0 0.0 0.0 rgb stroke\n`;
    }

    // Texto interior: Nombre y Número centrados
    const centerXPt = (mmToPt(piece.xMm + piece.effectiveWidthMm / 2)).toFixed(2);
    const centerYPt = (heightPt - mmToPt(piece.yMm + piece.effectiveHeightMm / 2)).toFixed(2);
    const cleanName = (piece.playerName || '').replace(/[()]/g, '');
    const cleanNum = (piece.playerNumber || '').replace(/[()]/g, '');

    ps += `/Helvetica-Bold findfont 16 scalefont setfont\n`;
    ps += `0.1 0.1 0.1 rgb\n`;
    ps += `${centerXPt} ${centerYPt} m\n`;
    ps += `(${cleanName} #${cleanNum}) show\n`;

    // Etiqueta de texto de identificación en costura
    if (includeLabels) {
      const cleanLabel = `${piece.playerName} #${piece.playerNumber} T${piece.sizeName} ${piece.pieceType}`.replace(/[()]/g, '');
      const labelX = mmToPt(piece.xMm + piece.effectiveWidthMm / 2).toFixed(2);
      const labelY = (heightPt - mmToPt(piece.yMm) + 3).toFixed(2);

      ps += `/Helvetica-Bold findfont 8.5 scalefont setfont\n`;
      ps += `0.2 0.2 0.2 rgb\n`;
      ps += `${labelX} ${labelY} m\n`;
      ps += `(${cleanLabel}) show\n`;
    }
  }

  ps += `\ngrestore
showpage
%%Trailer
%%EOF
`;

  return ps;
}
