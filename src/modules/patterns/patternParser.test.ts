import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePatternSvg } from './patternParser';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures/patterns');

describe('Pattern SVG Parser (Pruebas sobre Molde Real de Illustrator)', () => {
  it('debe leer y clasificar automáticamente el molde SVG "moldes_futbol_2026.svg"', () => {
    const filePath = path.join(FIXTURES_DIR, 'moldes_futbol_2026.svg');
    const svgContent = fs.readFileSync(filePath, 'utf8');

    const result = parsePatternSvg(svgContent, 'MOLDES FUTBOL 2026', 'FUTBOL', 'moldes_futbol_2026.svg');
    const { patternSet } = result;

    expect(patternSet.name).toBe('MOLDES FUTBOL 2026');
    expect(patternSet.garmentType).toBe('FUTBOL');
    expect(result.totalParsedElements).toBe(9); // 6 de T28 + 2 de T30 + 1 no asignada

    // Verificar que clasificó las 2 tallas
    expect(patternSet.sizes.length).toBe(2);
    
    // Talla 28
    const size28 = patternSet.sizes.find((s) => s.sizeName === '28');
    expect(size28).toBeDefined();
    expect(size28?.pieces.length).toBe(6);

    const delanteroT28 = size28?.pieces.find((p) => p.pieceType === 'DELANTERO');
    expect(delanteroT28).toBeDefined();
    expect(delanteroT28?.bbox.width).toBeGreaterThan(250); // Medida real en mm
    expect(delanteroT28?.bbox.height).toBeGreaterThan(500); // Medida real en mm
    expect(delanteroT28?.allowedRotationsDeg).toEqual([0]); // Delantero no se rota

    const mangaT28 = size28?.pieces.find((p) => p.pieceType === 'MANGA_IZQ');
    expect(mangaT28).toBeDefined();
    expect(mangaT28?.allowedRotationsDeg).toEqual([0, 180]); // Mangas permiten rotación 180°

    const shortFrontT28 = size28?.pieces.find((p) => p.pieceType === 'SHORT_FRENTE');
    expect(shortFrontT28).toBeDefined();

    // Talla 30
    const size30 = patternSet.sizes.find((s) => s.sizeName === '30');
    expect(size30).toBeDefined();
    expect(size30?.pieces.length).toBe(2); // Delantero y Espalda

    // Pieza no asignada para asignación manual
    expect(result.unassignedCount).toBe(1);
    expect(patternSet.unassignedPieces.length).toBe(1);
    expect(patternSet.unassignedPieces[0].originalElementId).toBe('PIEZA_SUELTA_ESPALDA_EXTRA');
    expect(patternSet.unassignedPieces[0].isAssigned).toBe(false);
  });
});
