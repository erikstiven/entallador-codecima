import { 
  NestingPieceInput, 
  NestingOptions, 
  NestingResult 
} from './types';
import { executeBottomLeftFill } from './heuristics/bottomLeftFill';
import { performModularNesting } from './modularNestingEngine';

/**
 * Motor central de Nesting 2D (Strip Packing) para HMB Entallador.
 * Ejecuta el algoritmo de empaquetado continuo garantizando:
 * - Contención estricta dentro del ancho útil (printableWidthMm, ej. 1120 mm configurable)
 * - Particionado automático en pliegos de máximo 500 cm (maxSheetLengthMm)
 * - Acomodo modular por jugador: [Delantero + Espalda + Mangas apiladas]
 * - Acomodo de shorts en pares lado a lado (2x2)
 * - Separación de archivos por tipo de prenda (Camisetas vs Shorts)
 * - No-solapamiento absoluto entre piezas
 */
export function runNestingEngine(
  pieces: NestingPieceInput[],
  options: NestingOptions
): NestingResult {
  const printableWidthMm = Math.max(100.0, options.printableWidthMm || 1120.0);
  const maxSheetLengthMm = Math.max(500.0, options.maxSheetLengthMm || 5000.0);

  if (!pieces || pieces.length === 0) {
    return {
      placedPieces: [],
      sheets: [],
      activeSheetIndex: 0,
      totalRollLengthMm: 0,
      printableWidthMm,
      maxSheetLengthMm,
      totalPiecesAreaMm2: 0,
      usedRollAreaMm2: 0,
      utilizationPercent: 0,
      wastePercent: 100,
      executionTimeMs: 0,
      groupingMode: options.groupingMode,
    };
  }

  // Validar y sanitizar opciones
  const sanitizedOptions: NestingOptions = {
    printableWidthMm,
    maxSheetLengthMm,
    spacingMm: Math.max(0.0, options.spacingMm !== undefined ? options.spacingMm : 6.0),
    sideMarginMm: Math.max(0.0, options.sideMarginMm !== undefined ? options.sideMarginMm : 5.0),
    topMarginMm: Math.max(0.0, options.topMarginMm !== undefined ? options.topMarginMm : 8.0),
    groupingMode: options.groupingMode || 'MAX_SAVINGS',
    allowRotation: options.allowRotation !== undefined ? options.allowRotation : true,
  };

  // 1. Modo Industrial Modular por Jugador
  if (sanitizedOptions.groupingMode === 'MODULAR_PLAYER' || sanitizedOptions.groupingMode === 'BY_PLAYER') {
    return performModularNesting(pieces, sanitizedOptions);
  }

  // 2. Modos Geométricos (MAX_SAVINGS, BY_SIZE, BY_PIECE_TYPE)
  return executeBottomLeftFill(pieces, sanitizedOptions);
}
