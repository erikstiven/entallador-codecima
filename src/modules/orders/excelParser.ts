import * as XLSX from 'xlsx';
import { 
  OrderItem, 
  OrderValidationConfig, 
  OrderSummary, 
  CsvExportOptions 
} from './types';
import { 
  normalizePlayerName, 
  normalizePlayerNumber, 
  normalizeSizeName, 
  normalizeGarmentType, 
  validateOrderList, 
  calculateOrderSummary 
} from './orderValidator';

/**
 * Normaliza nombres de encabezados para mapeo flexible
 */
function cleanHeaderName(header: string): string {
  return String(header)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos para la comparación de encabezados
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Identifica la correspondencia de columnas a partir de los encabezados del archivo
 */
function mapColumnIndices(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};

  headers.forEach((h, idx) => {
    const clean = cleanHeaderName(h);

    if (['talla', 'tallas', 'size', 'talle', 'tamano', 'medida'].includes(clean)) {
      map.size = idx;
    } else if (['nombre', 'jugador', 'name', 'player', 'atleta', 'apellido'].includes(clean)) {
      map.name = idx;
    } else if (['numero', 'num', 'dorsal', 'number', 'no', 'numcamiseta'].includes(clean)) {
      map.number = idx;
    } else if (['tipo', 'prenda', 'tipoprenda', 'uniforme', 'item', 'type'].includes(clean)) {
      map.garmentType = idx;
    } else if (['genero', 'sexo', 'gender', 'categoria'].includes(clean)) {
      map.gender = idx;
    } else if (['equipo', 'team', 'club'].includes(clean)) {
      map.team = idx;
    } else if (['observaciones', 'obs', 'notas', 'comentarios', 'notes'].includes(clean)) {
      map.notes = idx;
    } else if (['cantidad', 'cant', 'qty', 'quantity'].includes(clean)) {
      map.quantity = idx;
    }
  });

  return map;
}

export interface ParsedOrderResult {
  items: OrderItem[];
  summary: OrderSummary;
  sheetNames: string[];
  activeSheet: string;
}

/**
 * Parsea un buffer de archivo Excel (.xlsx, .xls) o CSV y extrae la nómina de producción
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer | Uint8Array,
  config: OrderValidationConfig = { availableSizes: ['26', '28', '30', '32', '34', 'S', 'M', 'L', 'XL'] }
): ParsedOrderResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('El archivo no contiene ninguna hoja de cálculo.');
  }

  const activeSheet = sheetNames[0];
  const worksheet = workbook.Sheets[activeSheet];

  // Convertir hoja a matriz de filas crudas (array de arrays)
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length === 0) {
    return {
      items: [],
      summary: calculateOrderSummary([]),
      sheetNames,
      activeSheet,
    };
  }

  // Buscar fila de encabezados (primera fila no vacía)
  let headerRowIndex = 0;
  while (headerRowIndex < rows.length && (!rows[headerRowIndex] || rows[headerRowIndex].every((c) => String(c).trim() === ''))) {
    headerRowIndex++;
  }

  if (headerRowIndex >= rows.length) {
    return {
      items: [],
      summary: calculateOrderSummary([]),
      sheetNames,
      activeSheet,
    };
  }

  const headerRow = rows[headerRowIndex].map((c) => String(c || ''));
  const columnMap = mapColumnIndices(headerRow);

  const rawItems: OrderItem[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c).trim() === '')) {
      continue; // Ignorar filas en blanco
    }

    const rawSize = columnMap.size !== undefined ? row[columnMap.size] : '';
    const rawName = columnMap.name !== undefined ? row[columnMap.name] : '';
    const rawNumber = columnMap.number !== undefined ? row[columnMap.number] : '';
    const rawType = columnMap.garmentType !== undefined ? row[columnMap.garmentType] : 'COMPLETO';
    const rawGender = columnMap.gender !== undefined ? String(row[columnMap.gender] || '') : undefined;
    const rawTeam = columnMap.team !== undefined ? String(row[columnMap.team] || '') : undefined;
    const rawNotes = columnMap.notes !== undefined ? String(row[columnMap.notes] || '') : undefined;
    const rawQty = columnMap.quantity !== undefined ? parseInt(String(row[columnMap.quantity]), 10) || 1 : 1;

    // Normalizaciones automáticas
    const playerName = normalizePlayerName(rawName);
    const playerNumber = normalizePlayerNumber(rawNumber);
    const sizeName = normalizeSizeName(rawSize);
    const garmentType = normalizeGarmentType(rawType);

    rawItems.push({
      id: `item_row_${r + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rowNumber: r + 1,
      playerName,
      playerNumber,
      sizeName,
      garmentType,
      gender: rawGender,
      team: rawTeam,
      notes: rawNotes,
      quantity: rawQty > 0 ? rawQty : 1,
      isValid: true,
      errors: [],
      warnings: [],
    });
  }

  // Ejecutar validaciones declarativas
  const validatedItems = validateOrderList(rawItems, config);
  const summary = calculateOrderSummary(validatedItems);

  return {
    items: validatedItems,
    summary,
    sheetNames,
    activeSheet,
  };
}

/**
 * Genera un archivo CSV filtrado por talla con codificación y delimitador configurables
 */
export function exportOrderToCsvBySize(
  items: OrderItem[],
  targetSize: string,
  options: CsvExportOptions = { delimiter: ',', includeBom: true, includeHeader: true }
): string {
  const normTarget = normalizeSizeName(targetSize).toUpperCase();
  const filtered = items.filter(
    (it) => normalizeSizeName(it.sizeName).toUpperCase() === normTarget
  );

  const lines: string[] = [];

  if (options.includeHeader) {
    lines.push(`Nombre${options.delimiter}Numero`);
  }

  for (const item of filtered) {
    // Si el nombre contiene comas o comillas, escaparlo según estándar RFC 4180
    let safeName = item.playerName;
    if (safeName.includes(options.delimiter) || safeName.includes('"')) {
      safeName = `"${safeName.replace(/"/g, '""')}"`;
    }

    lines.push(`${safeName}${options.delimiter}${item.playerNumber}`);
  }

  const content = lines.join('\r\n');
  return options.includeBom ? `\uFEFF${content}` : content;
}

/**
 * Genera un libro Excel con el resumen consolidado de producción del pedido
 */
export function generateProductionSummaryWorkbook(
  items: OrderItem[],
  clientName: string = 'Cliente General',
  teamName: string = 'Equipo'
): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Lista completa de producción
  const playerRows = items.map((it) => ({
    'Fila': it.rowNumber,
    'Talla': it.sizeName,
    'Nombre': it.playerName,
    'Dorsal': it.playerNumber,
    'Tipo Prenda': it.garmentType,
    'Cantidad': it.quantity,
    'Estado': it.isValid ? 'CORRECTO' : 'CON ERRORES',
    'Observaciones': it.notes || (it.errors.length > 0 ? it.errors.map(e => e.message).join(' | ') : ''),
  }));

  const wsPlayers = XLSX.utils.json_to_sheet(playerRows);
  XLSX.utils.book_append_sheet(wb, wsPlayers, 'Lista Jugadores');

  // Hoja 2: Resumen por Talla
  const summary = calculateOrderSummary(items);
  const sizeRows = Object.entries(summary.bySize).map(([size, count]) => ({
    'Talla': size,
    'Cantidad Uniformes': count,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(sizeRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Tallas');

  const binary = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(binary);
}

/**
 * Genera una plantilla Excel oficial limpia para pedidos de uniformes
 */
export function generateOrderTemplateWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const templateRows = [
    {
      'Talla': '28',
      'Nombre': 'MATEO',
      'Dorsal': '10',
      'Tipo Prenda': 'COMPLETO',
      'Cantidad': 1,
      'Observaciones': 'Capitán',
    },
    {
      'Talla': '28',
      'Nombre': 'CAMILA',
      'Dorsal': '7',
      'Tipo Prenda': 'COMPLETO',
      'Cantidad': 1,
      'Observaciones': '',
    },
    {
      'Talla': '30',
      'Nombre': 'CARLOS',
      'Dorsal': '21',
      'Tipo Prenda': 'CAMISETA',
      'Cantidad': 1,
      'Observaciones': 'Manga corta',
    },
    {
      'Talla': '30',
      'Nombre': 'CHRISTOPHER',
      'Dorsal': '9',
      'Tipo Prenda': 'COMPLETO',
      'Cantidad': 1,
      'Observaciones': 'Nombre largo',
    },
    {
      'Talla': '32',
      'Nombre': 'DANIELA',
      'Dorsal': '15',
      'Tipo Prenda': 'COMPLETO',
      'Cantidad': 1,
      'Observaciones': '',
    },
    {
      'Talla': '32',
      'Nombre': 'ÁLVARO',
      'Dorsal': '4',
      'Tipo Prenda': 'COMPLETO',
      'Cantidad': 1,
      'Observaciones': '',
    },
    {
      'Talla': 'S',
      'Nombre': 'ÍÑIGO',
      'Dorsal': '8',
      'Tipo Prenda': 'COMPLETO',
      'Cantidad': 1,
      'Observaciones': '',
    },
    {
      'Talla': 'M',
      'Nombre': 'VALENTINA',
      'Dorsal': '12',
      'Tipo Prenda': 'SHORT',
      'Cantidad': 1,
      'Observaciones': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lista Jugadores');

  const binary = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(binary);
}
