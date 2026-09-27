import { describe, it, expect } from 'vitest';
import { 
  normalizePlayerName, 
  normalizeSizeName, 
  normalizePlayerNumber, 
  normalizeGarmentType, 
  validateOrderItem, 
  calculateOrderSummary 
} from './orderValidator';
import { OrderItem } from './types';

describe('Order Validator Unit Tests', () => {
  it('debe normalizar nombres eliminando espacios y pasando a mayúsculas', () => {
    expect(normalizePlayerName('   carlos   alberto   ')).toBe('CARLOS ALBERTO');
    expect(normalizePlayerName('mateo')).toBe('MATEO');
    expect(normalizePlayerName('')).toBe('');
  });

  it('debe normalizar números de camiseta a strings limpios', () => {
    expect(normalizePlayerNumber(10)).toBe('10');
    expect(normalizePlayerNumber('  07 ')).toBe('07');
    expect(normalizePlayerNumber('99')).toBe('99');
  });

  it('debe normalizar tallas con prefijos numéricos o alfabéticos', () => {
    expect(normalizeSizeName('TALLA 28')).toBe('28');
    expect(normalizeSizeName('T-30')).toBe('30');
    expect(normalizeSizeName('t32')).toBe('32');
    expect(normalizeSizeName('  m  ')).toBe('M');
    expect(normalizeSizeName('XL')).toBe('XL');
  });

  it('debe normalizar tipos de prenda a COMPLETO, CAMISETA o SHORT', () => {
    expect(normalizeGarmentType('Camiseta')).toBe('CAMISETA');
    expect(normalizeGarmentType('jersey')).toBe('CAMISETA');
    expect(normalizeGarmentType('Short')).toBe('SHORT');
    expect(normalizeGarmentType('pantaloneta')).toBe('SHORT');
    expect(normalizeGarmentType('completo')).toBe('COMPLETO');
    expect(normalizeGarmentType('cualquier_cosa')).toBe('COMPLETO');
  });

  it('debe validar nombres con caracteres especiales y advertir nombres largos', () => {
    const baseItem: OrderItem = {
      id: '1',
      rowNumber: 1,
      playerName: 'CHRISTOPHER ALEXANDER', // 21 letras (> 14)
      playerNumber: '10',
      sizeName: '28',
      garmentType: 'COMPLETO',
      quantity: 1,
      isValid: true,
      errors: [],
      warnings: [],
    };

    const validated = validateOrderItem(baseItem, {
      availableSizes: ['28', '30'],
      maxNameLengthWarn: 14,
    });

    expect(validated.isValid).toBe(true);
    expect(validated.warnings.some((w) => w.code === 'LONG_NAME')).toBe(true);
  });

  it('debe rechazar nombres vacíos o con caracteres ilegales', () => {
    const emptyNameItem: OrderItem = {
      id: '2',
      rowNumber: 2,
      playerName: '',
      playerNumber: '10',
      sizeName: '28',
      garmentType: 'COMPLETO',
      quantity: 1,
      isValid: true,
      errors: [],
      warnings: [],
    };

    const validatedEmpty = validateOrderItem(emptyNameItem, { availableSizes: ['28'] });
    expect(validatedEmpty.isValid).toBe(false);
    expect(validatedEmpty.errors.some((e) => e.code === 'EMPTY_NAME')).toBe(true);

    const illegalItem: OrderItem = {
      ...emptyNameItem,
      playerName: 'JUAN$$*',
    };
    const validatedIllegal = validateOrderItem(illegalItem, { availableSizes: ['28'] });
    expect(validatedIllegal.isValid).toBe(false);
    expect(validatedIllegal.errors.some((e) => e.code === 'INVALID_CHARACTERS')).toBe(true);
  });

  it('debe calcular correctamente el conteo de piezas según tipo de prenda', () => {
    const items: OrderItem[] = [
      {
        id: '1',
        rowNumber: 1,
        playerName: 'MATEO',
        playerNumber: '10',
        sizeName: '28',
        garmentType: 'COMPLETO', // 6 piezas
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        id: '2',
        rowNumber: 2,
        playerName: 'LUCAS',
        playerNumber: '9',
        sizeName: '28',
        garmentType: 'CAMISETA', // 4 piezas
        quantity: 2, // x2 cantidad = 8 piezas
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        id: '3',
        rowNumber: 3,
        playerName: 'PEDRO',
        playerNumber: '5',
        sizeName: '30',
        garmentType: 'SHORT', // 2 piezas
        quantity: 1,
        isValid: true,
        errors: [],
        warnings: [],
      },
    ];

    const summary = calculateOrderSummary(items);
    // 6 + (4*2) + 2 = 16 piezas
    expect(summary.totalPiecesCount).toBe(16);
    expect(summary.bySize['28']).toBe(3); // 1 + 2
    expect(summary.bySize['30']).toBe(1);
    expect(summary.validCount).toBe(3);
    expect(summary.invalidCount).toBe(0);
  });
});
