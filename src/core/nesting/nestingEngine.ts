import { 
  NestingPieceInput, 
  NestingOptions, 
  NestingResult 
} from './types';
import { executeBottomLeftFill } from './heuristics/bottomLeftFill';

/**
 * Motor central de Nesting 2D (Strip Packing) para HMB Entallador.
 * Ejecuta el algoritmo de empaquetado continuo garantizando:
 * - Contención estricta dentro del ancho útil (printableWidthMm)
 * - Separación de seguridad mínima (spacingMm, ej. 7.0 mm)
 * - No-solapamiento absoluto entre piezas
 * - Preservación de piezas fijadas (🔒 isLocked)
 * - Agrupamiento según requerimientos de producción (MAX_SAVINGS, BY_SIZE, BY_PLAYER, BY_PIECE_TYPE)
 */
export function runNestingEngine(
  pieces: NestingPieceInput[],
  options: NestingOptions
): NestingResult {
  if (!pieces || pieces.length === 0) {
    return {
      placedPieces: [],
      totalRollLengthMm: 0,
      printableWidthMm: options.printableWidthMm,
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
    printableWidthMm: Math.max(100.0, options.printableWidthMm || 1120.0),
    spacingMm: Math.max(0.0, options.spacingMm !== undefined ? options.spacingMm : 7.0),
    sideMarginMm: Math.max(0.0, options.sideMarginMm !== undefined ? options.sideMarginMm : 5.0),
    topMarginMm: Math.max(0.0, options.topMarginMm !== undefined ? options.topMarginMm : 5.0),
    groupingMode: options.groupingMode || 'MAX_SAVINGS',
    allowRotation: options.allowRotation !== undefined ? options.allowRotation : true,
  };

  // Ejecución de la heurística Bottom-Left-Fill (Fase A)
  return executeBottomLeftFill(pieces, sanitizedOptions);
}
