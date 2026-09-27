import * as XLSX from 'xlsx';
import { ExportPayload } from './types';

/**
 * Genera una hoja de cálculo Excel (.xlsx) estructurada para el corte y confección en taller
 */
export function generateProductionExcel(payload: ExportPayload): Uint8Array {
  const { placedPieces, nestingResult, projectName = 'PEDIDO_PRODUCCION', clientName = 'TALLER' } = payload;

  const wb = XLSX.utils.book_new();

  // 1. Hoja "Detalle_Corte"
  const detailHeaders = [
    '#',
    'Jugador',
    'Número',
    'Talla',
    'Tipo Prenda',
    'Posición X (mm)',
    'Posición Y (mm)',
    'Ancho (mm)',
    'Alto (mm)',
    'Rotación (°)',
    'Estado',
  ];

  const detailRows = placedPieces.map((p, idx) => [
    idx + 1,
    p.playerName,
    p.playerNumber,
    p.sizeName,
    p.pieceType,
    p.xMm,
    p.yMm,
    p.effectiveWidthMm,
    p.effectiveHeightMm,
    p.rotationDeg,
    p.isLocked ? 'Bloqueada (Manual)' : 'Automática',
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);

  // Ajustar anchos de columnas
  wsDetail['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle_Corte');

  // 2. Hoja "Resumen_Taller"
  // Contar piezas por talla
  const sizeCountMap: Record<string, number> = {};
  for (const p of placedPieces) {
    sizeCountMap[p.sizeName] = (sizeCountMap[p.sizeName] || 0) + 1;
  }

  const summaryData: any[][] = [
    ['REPORTE DE PRODUCCIÓN TEXTIL — HMB ENTALLADOR'],
    ['Fecha de Generación', new Date().toLocaleString('es-ES')],
    ['Proyecto / Pedido', projectName],
    ['Cliente', clientName],
    [''],
    ['MÉTRICAS DEL ROLLO DE IMPRESIÓN'],
    ['Ancho Útil de Bobina', `${nestingResult.printableWidthMm} mm`],
    ['Largo Total Consumido', `${(nestingResult.totalRollLengthMm / 1000.0).toFixed(2)} metros`],
    ['Área Total de Bobina', `${(nestingResult.usedRollAreaMm2 / 1_000_000.0).toFixed(2)} m²`],
    ['Área Útil de Piezas', `${(nestingResult.totalPiecesAreaMm2 / 1_000_000.0).toFixed(2)} m²`],
    ['% Aprovechamiento de Papel', `${nestingResult.utilizationPercent}%`],
    ['% Desperdicio Estimado', `${nestingResult.wastePercent}%`],
    ['Total de Piezas Entalladas', placedPieces.length],
    ['Modo de Agrupamiento', nestingResult.groupingMode],
    [''],
    ['DESGLOSE DE PIEZAS POR TALLA'],
    ['Talla', 'Cantidad de Piezas'],
  ];

  for (const [size, count] of Object.entries(sizeCountMap)) {
    summaryData.push([`Talla ${size}`, count]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 24 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Taller');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Genera un archivo CSV con BOM UTF-8 para compatibilidad universal con Excel
 */
export function generateProductionCsv(payload: ExportPayload): string {
  const { placedPieces } = payload;
  const headers = ['#', 'Jugador', 'Numero', 'Talla', 'Tipo Prenda', 'X_mm', 'Y_mm', 'Ancho_mm', 'Alto_mm', 'Rotacion'];

  const rows = placedPieces.map((p, idx) => [
    idx + 1,
    `"${p.playerName.replace(/"/g, '""')}"`,
    `"${p.playerNumber}"`,
    `"${p.sizeName}"`,
    `"${p.pieceType}"`,
    p.xMm.toFixed(2),
    p.yMm.toFixed(2),
    p.effectiveWidthMm.toFixed(2),
    p.effectiveHeightMm.toFixed(2),
    p.rotationDeg,
  ].join(';'));

  // Prepend UTF-8 BOM (\uFEFF)
  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
}
