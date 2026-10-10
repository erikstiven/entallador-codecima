import { ExportOptions, ExportPayload, ExportResult } from './types';
import { generateFullRollSvg } from './svgExporter';
import { generateFullRollPdf } from './pdfExporter';
import { generateFullRollEps } from './epsExporter';
import { generateProductionExcel, generateProductionCsv } from './productionSummaryExporter';
import { resolvePieceSvg } from '@/modules/generator/garmentGenerator';
import { convertSvgToEpsClient, isElectronEpsAvailable } from './epsConversionClient';

/**
 * Servicio central de exportación para HMB Entallador.
 * Genera archivos a escala 1:1 física calibrada para Mimaki RasterLink, Epson y Adobe Illustrator.
 */
export async function exportProductionRoll(
  payload: ExportPayload,
  options: ExportOptions
): Promise<ExportResult> {
  const { placedPieces, nestingResult } = payload;
  const { format, fileName, paperRollWidthMm, totalRollLengthMm } = options;

  // Verificación no bloqueante de fuentes tipográficas
  if (format === 'SVG' || format === 'PDF' || format === 'EPS') {
    const unresolvedFonts = new Set<string>();
    for (const piece of placedPieces) {
      const source = resolvePieceSvg(piece);
      const regex = /data-hmb-unresolved-font=["']([^"']+)["']/gi;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(source)) !== null) {
        unresolvedFonts.add(match[1]);
      }
      if (/<text\b/i.test(source)) {
        const family = source.match(/font-family=["'](?:&apos;|')?([^,'"&]+)/i)?.[1]?.trim();
        if (family) unresolvedFonts.add(family);
      }
    }
    if (unresolvedFonts.size > 0) {
      console.warn(
        `[Export] Fuentes detectadas en piezas: ${Array.from(unresolvedFonts).join(', ')}. Exportando con renderizado vectorial.`
      );
    }
  }

  let blob: Blob;
  let mimeType: string;
  let ext: string;

  switch (format) {
    case 'PDF': {
      const pdfBytes = await generateFullRollPdf(
        placedPieces,
        paperRollWidthMm,
        totalRollLengthMm,
        options
      );
      blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      mimeType = 'application/pdf';
      ext = '.pdf';
      break;
    }

    case 'SVG': {
      const svgString = generateFullRollSvg(
        placedPieces,
        paperRollWidthMm,
        totalRollLengthMm,
        options
      );
      blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      mimeType = 'image/svg+xml';
      ext = '.svg';
      break;
    }

    case 'EPS': {
      // 1. Generar SVG maestro existente (fuente de verdad vectorial)
      const svgString = generateFullRollSvg(
        placedPieces,
        paperRollWidthMm,
        totalRollLengthMm,
        options
      );

      // 2. Si el puente Electron está disponible, convertir vía Inkscape CLI
      if (isElectronEpsAvailable()) {
        const conversionResult = await convertSvgToEpsClient(
          svgString,
          {
            dpi: 300,
            postscriptLevel: 3,
            convertTextToPaths: true,
          },
          {
            widthMm: paperRollWidthMm,
            heightMm: totalRollLengthMm,
          }
        );

        if (!conversionResult.success || !conversionResult.epsContent) {
          throw new Error(
            conversionResult.error ||
              'No se pudo generar el archivo EPS mediante Inkscape. Verifique la instalación del motor.'
          );
        }

        blob = new Blob([conversionResult.epsContent], { type: 'application/postscript;charset=utf-8' });
      } else {
        // En entorno puramente web sin Electron, advertir y usar generador directo
        console.warn(
          '[Export] Entorno de escritorio Electron no detectado; utilizando generador EPS directo.'
        );
        const epsString = generateFullRollEps(
          placedPieces,
          paperRollWidthMm,
          totalRollLengthMm,
          options
        );
        blob = new Blob([epsString], { type: 'application/postscript;charset=utf-8' });
      }

      mimeType = 'application/postscript';
      ext = '.eps';
      break;
    }

    case 'EXCEL_SUMMARY': {
      const excelBytes = generateProductionExcel(payload);
      blob = new Blob([excelBytes as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = '.xlsx';
      break;
    }

    case 'CSV_SUMMARY': {
      const csvString = generateProductionCsv(payload);
      blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
      mimeType = 'text/csv';
      ext = '.csv';
      break;
    }

    default:
      throw new Error(`Formato de exportación no soportado: ${format}`);
  }

  const cleanFileName = fileName.endsWith(ext) ? fileName : `${fileName}${ext}`;

  return {
    fileName: cleanFileName,
    blob,
    mimeType,
    fileSizeBytes: blob.size,
    widthMm: paperRollWidthMm,
    heightMm: totalRollLengthMm,
    totalPieces: placedPieces.length,
  };
}

/**
 * Dispara la descarga del archivo en el sistema operativo del usuario
 */
export function triggerFileDownload(result: ExportResult): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
