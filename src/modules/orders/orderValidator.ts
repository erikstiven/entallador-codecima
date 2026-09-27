import { 
  OrderItem, 
  OrderValidationConfig, 
  OrderSummary, 
  GarmentType, 
  ValidationError, 
  ValidationWarning 
} from './types';

/**
 * Normaliza el nombre del jugador a mayúsculas limpias sin espacios redundantes
 */
export function normalizePlayerName(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/**
 * Normaliza el número del jugador eliminando espacios y caracteres no deseados
 */
export function normalizePlayerNumber(raw: string | number): string {
  if (raw === undefined || raw === null) return '';
  return String(raw).trim();
}

/**
 * Normaliza la denominación de la talla (ej. "TALLA 28", "T-28", "t28" -> "28", "m" -> "M")
 */
export function normalizeSizeName(raw: string | number): string {
  if (raw === undefined || raw === null) return '';
  const str = String(raw).trim().toUpperCase();

  // Si viene con prefijo como "TALLA 28", "T-28", "T28", normalizar a "28" si es numérico
  const match = str.match(/^(?:TALLA\s*|T-?|SZ-?)(\d+)$/i);
  if (match) {
    return match[1];
  }

  // Tallas alfabéticas estándar: S, M, L, XL, XXL, etc.
  return str.replace(/\s+/g, '');
}

/**
 * Normaliza el tipo de prenda a una de las categorías válidas
 */
export function normalizeGarmentType(raw: string): GarmentType {
  if (!raw || typeof raw !== 'string') return 'COMPLETO';
  const clean = raw.trim().toUpperCase();

  if (clean.includes('CAMIS') || clean.includes('PLAYERA') || clean.includes('JERSEY') || clean.includes('REMERA')) {
    return 'CAMISETA';
  }
  if (clean.includes('SHORT') || clean.includes('PANTALONETA') || clean.includes('BERMUDA')) {
    return 'SHORT';
  }
  return 'COMPLETO';
}

/**
 * Valida un ítem individual de la nómina contra las reglas de producción
 */
export function validateOrderItem(
  item: OrderItem,
  config: OrderValidationConfig,
  allItems: OrderItem[] = []
): OrderItem {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const maxNameLength = config.maxNameLengthWarn || 14;

  // 1. Validación del Nombre
  if (!item.playerName) {
    errors.push({
      field: 'playerName',
      message: 'El nombre del jugador no puede estar vacío.',
      code: 'EMPTY_NAME',
    });
  } else {
    // Caracteres permitidos: Letras estándar, tildes (Á,É,Í,Ó,Ú), diéresis (Ü), eñe (Ñ), cedilla (Ç), espacios, guiones y puntos
    const validNamePattern = /^[A-ZÁÉÍÓÚÜÑÇ0-9\s.\-']+$/i;
    if (!validNamePattern.test(item.playerName)) {
      errors.push({
        field: 'playerName',
        message: `El nombre "${item.playerName}" contiene caracteres especiales o símbolos no admitidos.`,
        code: 'INVALID_CHARACTERS',
      });
    }

    if (item.playerName.length > maxNameLength) {
      warnings.push({
        field: 'playerName',
        message: `Nombre largo (${item.playerName.length} caracteres). Se activará reducción automática de escala horizontal.`,
        code: 'LONG_NAME',
      });
    }

    if (/^[0-9]+$/.test(item.playerName)) {
      warnings.push({
        field: 'playerName',
        message: `El nombre contiene únicamente números: "${item.playerName}".`,
        code: 'NUMERIC_NAME',
      });
    }
  }

  // 2. Validación del Número
  if (!item.playerNumber) {
    errors.push({
      field: 'playerNumber',
      message: 'El número o dorsal del jugador no puede estar vacío.',
      code: 'EMPTY_NUMBER',
    });
  } else {
    // Si se activa unicidad estricta de dorsal en el mismo equipo/pedido
    if (config.strictNumberUniqueness) {
      const isDuplicate = allItems.some(
        (other) =>
          other.id !== item.id &&
          other.playerNumber === item.playerNumber &&
          item.playerNumber !== ''
      );
      if (isDuplicate) {
        errors.push({
          field: 'playerNumber',
          message: `El dorsal #${item.playerNumber} está repetido en el pedido.`,
          code: 'DUPLICATE_NUMBER',
        });
      }
    }
  }

  // 3. Validación de Talla y Molde Disponible
  if (!item.sizeName) {
    errors.push({
      field: 'sizeName',
      message: 'La talla no puede estar vacía.',
      code: 'SIZE_NOT_FOUND',
    });
  } else if (config.availableSizes && config.availableSizes.length > 0) {
    const sizeUpper = item.sizeName.toUpperCase();
    const isAvailable = config.availableSizes.some(
      (s) => s.toUpperCase() === sizeUpper || normalizeSizeName(s) === sizeUpper
    );

    if (!isAvailable) {
      errors.push({
        field: 'sizeName',
        message: `La talla "${item.sizeName}" no existe en el molde maestro seleccionado. Tallas disponibles: [${config.availableSizes.join(', ')}].`,
        code: 'SIZE_NOT_FOUND',
      });
    }
  }

  return {
    ...item,
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida una lista completa de ítems de pedido
 */
export function validateOrderList(
  items: OrderItem[],
  config: OrderValidationConfig
): OrderItem[] {
  return items.map((item) => validateOrderItem(item, config, items));
}

/**
 * Calcula el resumen métrico de producción del pedido
 */
export function calculateOrderSummary(items: OrderItem[]): OrderSummary {
  const bySize: Record<string, number> = {};
  const byGarmentType: Record<GarmentType, number> = {
    COMPLETO: 0,
    CAMISETA: 0,
    SHORT: 0,
  };

  let validCount = 0;
  let totalPiecesCount = 0;

  for (const item of items) {
    if (item.isValid) {
      validCount++;
    }

    // Conteo por talla
    const sizeKey = item.sizeName || 'SIN_TALLA';
    bySize[sizeKey] = (bySize[sizeKey] || 0) + item.quantity;

    // Conteo por tipo de prenda
    byGarmentType[item.garmentType] = (byGarmentType[item.garmentType] || 0) + item.quantity;

    // Cálculo de piezas según tipo de uniforme:
    // COMPLETO = 6 piezas (Delantero, Espalda, 2 Mangas, 2 Shorts)
    // CAMISETA = 4 piezas (Delantero, Espalda, 2 Mangas)
    // SHORT = 2 piezas (Short Frente, Short Espalda)
    if (item.garmentType === 'COMPLETO') {
      totalPiecesCount += 6 * item.quantity;
    } else if (item.garmentType === 'CAMISETA') {
      totalPiecesCount += 4 * item.quantity;
    } else if (item.garmentType === 'SHORT') {
      totalPiecesCount += 2 * item.quantity;
    }
  }

  return {
    totalItems: items.length,
    validCount,
    invalidCount: items.length - validCount,
    hasErrors: items.length - validCount > 0,
    totalPiecesCount,
    bySize,
    byGarmentType,
  };
}
