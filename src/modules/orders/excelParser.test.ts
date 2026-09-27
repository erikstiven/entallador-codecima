import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { 
  parseExcelBuffer, 
  exportOrderToCsvBySize, 
  generateProductionSummaryWorkbook 
} from './excelParser';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures/excel');

describe('Excel & CSV Parser Module (Pruebas sobre Archivos Reales)', () => {
  it('debe leer y parsear correctamente el archivo real "pedido_valido.xlsx"', () => {
    const filePath = path.join(FIXTURES_DIR, 'pedido_valido.xlsx');
    const buffer = fs.readFileSync(filePath);

    const result = parseExcelBuffer(buffer, {
      availableSizes: ['28', '30', '32', 'S', 'M', 'L'],
    });

    expect(result.items.length).toBe(8);
    expect(result.summary.validCount).toBe(8);
    expect(result.summary.invalidCount).toBe(0);
    expect(result.summary.hasErrors).toBe(false);

    // Verificar primer jugador: MATEO #10 Talla 28 Completo
    const mateo = result.items[0];
    expect(mateo.playerName).toBe('MATEO');
    expect(mateo.playerNumber).toBe('10');
    expect(mateo.sizeName).toBe('28');
    expect(mateo.garmentType).toBe('COMPLETO');
    expect(mateo.notes).toBe('Capitán');
    expect(mateo.isValid).toBe(true);

    // Verificar jugador con tilde y eñe: ÍÑIGO #8 Talla S
    const inigo = result.items.find((it) => it.playerName === 'ÍÑIGO');
    expect(inigo).toBeDefined();
    expect(inigo?.playerNumber).toBe('8');
    expect(inigo?.sizeName).toBe('S');
    expect(inigo?.isValid).toBe(true);

    // Verificar advertencia por nombre largo: CHRISTOPHER (11 letras, o > 10)
    const christopher = result.items.find((it) => it.playerName === 'CHRISTOPHER');
    expect(christopher).toBeDefined();

    // Resumen por tallas
    expect(result.summary.bySize['28']).toBe(2);
    expect(result.summary.bySize['30']).toBe(2);
    expect(result.summary.bySize['32']).toBe(2);
    expect(result.summary.bySize['S']).toBe(1);
    expect(result.summary.bySize['M']).toBe(1);

    // Cálculo total de piezas:
    // 6 COMPLETOS * 6 pzs = 36
    // 1 CAMISETA * 4 pzs = 4
    // 1 SHORT * 2 pzs = 2
    // Total = 42 piezas
    expect(result.summary.totalPiecesCount).toBe(42);
  });

  it('debe detectar errores y advertencias en "pedido_con_errores.xlsx"', () => {
    const filePath = path.join(FIXTURES_DIR, 'pedido_con_errores.xlsx');
    const buffer = fs.readFileSync(filePath);

    const result = parseExcelBuffer(buffer, {
      availableSizes: ['28', '30', '32'],
      strictNumberUniqueness: true,
    });

    expect(result.items.length).toBe(5);
    expect(result.summary.hasErrors).toBe(true);
    expect(result.summary.invalidCount).toBeGreaterThan(0);

    // Fila 2: Talla T99 no disponible en molde
    const camila = result.items[1];
    expect(camila.sizeName).toBe('99');
    expect(camila.isValid).toBe(false);
    expect(camila.errors.some((e) => e.code === 'SIZE_NOT_FOUND')).toBe(true);

    // Fila 3: Nombre vacío
    const unnamed = result.items[2];
    expect(unnamed.isValid).toBe(false);
    expect(unnamed.errors.some((e) => e.code === 'EMPTY_NAME')).toBe(true);

    // Fila 4: Número vacío y caracteres ilegales (#)
    const carlos = result.items[3];
    expect(carlos.isValid).toBe(false);
    expect(carlos.errors.some((e) => e.code === 'EMPTY_NUMBER')).toBe(true);
    expect(carlos.errors.some((e) => e.code === 'INVALID_CHARACTERS')).toBe(true);

    // Fila 5: Número 10 duplicado con MATEO (con strictNumberUniqueness: true)
    const daniela = result.items[4];
    expect(daniela.errors.some((e) => e.code === 'DUPLICATE_NUMBER')).toBe(true);
  });

  it('debe parsear correctamente el archivo CSV con UTF-8 BOM y tildes', () => {
    const filePath = path.join(FIXTURES_DIR, 'pedido_tildes_y_enie.csv');
    const buffer = fs.readFileSync(filePath);

    const result = parseExcelBuffer(buffer, {
      availableSizes: ['28', '30', '32'],
    });

    expect(result.items.length).toBe(4);
    expect(result.items.map((i) => i.playerName)).toEqual([
      'SEBASTIÁN',
      'CAÑETE',
      'ÁNGEL',
      'MARTÍN',
    ]);
  });

  it('debe exportar CSV por talla con formato "Nombre,Numero" y UTF-8 BOM', () => {
    const filePath = path.join(FIXTURES_DIR, 'pedido_valido.xlsx');
    const buffer = fs.readFileSync(filePath);
    const { items } = parseExcelBuffer(buffer);

    const csvOutput = exportOrderToCsvBySize(items, '28', {
      delimiter: ',',
      includeBom: true,
      includeHeader: true,
    });

    // Verificar BOM presente
    expect(csvOutput.startsWith('\uFEFF')).toBe(true);

    // Verificar contenido
    expect(csvOutput).toContain('Nombre,Numero');
    expect(csvOutput).toContain('MATEO,10');
    expect(csvOutput).toContain('CAMILA,7');
    // No debe contener jugadores de otra talla
    expect(csvOutput).not.toContain('CARLOS');
  });

  it('debe generar el libro Excel de resumen consolidado de producción', () => {
    const filePath = path.join(FIXTURES_DIR, 'pedido_valido.xlsx');
    const buffer = fs.readFileSync(filePath);
    const { items } = parseExcelBuffer(buffer);

    const summaryWorkbook = generateProductionSummaryWorkbook(items, 'Colegio Francia', 'Sub-15');
    expect(summaryWorkbook).toBeInstanceOf(Uint8Array);
    expect(summaryWorkbook.length).toBeGreaterThan(1000); // Archivo binario Excel generado
  });
});
