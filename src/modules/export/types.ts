import { PlacedNestingPiece, NestingResult } from '@/core/nesting/types';

export type ExportFormat = 'PDF' | 'SVG' | 'EPS' | 'EXCEL_SUMMARY' | 'CSV_SUMMARY';

export type RipProfileType = 'MIMAKI_RASTERLINK' | 'EPSON_EDGE_PRINT' | 'GENERIC_RIP';

export interface ExportOptions {
  format: ExportFormat;
  fileName: string;
  ripProfile: RipProfileType;
  includeCutContour: boolean; // Guía visible opcional; debe permanecer false en impresión textil normal
  cutContourColor: string; // Color de la guía cuando se solicita explícitamente
  cutContourWidthMm: number; // Grosor físico de la guía
  includeSeamLabels: boolean; // Etiquetas exteriores de identificación de jugador/talla
  paperRollWidthMm: number;
  totalRollLengthMm: number;
}

export interface ExportPayload {
  placedPieces: PlacedNestingPiece[];
  nestingResult: NestingResult;
  projectName?: string;
  clientName?: string;
}

export interface ExportResult {
  fileName: string;
  blob: Blob;
  mimeType: string;
  fileSizeBytes: number;
  widthMm: number;
  heightMm: number;
  totalPieces: number;
}
