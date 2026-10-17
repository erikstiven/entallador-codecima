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
    expect(mangaT28?.allowedRotationsDeg).toEqual([0, 90, 180, 270]);

    const shortFrontT28 = size28?.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ' || p.pieceType === 'SHORT_FRENTE');
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

  it('debe empatar correctamente 26_I como PANTALONETA_IZQ y 26_D como PANTALONETA_DER incluso si 26_D viene primero en el XML', () => {
    // Simulamos un SVG donde la pierna derecha 26_D fue escrita primero en el XML
    const svgWithShorts = `<?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1000mm" height="800mm" viewBox="0 0 1000 800">
      <!-- Pierna Derecha primero en XML pero a la derecha en X (X=500..880, Y=50..450, alto 400mm, área > 130000mm²) -->
      <path id="26_D" d="M 500,50 L 880,50 L 880,450 L 500,450 Z" />
      <!-- Pierna Izquierda segunda en XML pero a la izquierda en X (X=50..430, Y=50..450) -->
      <path id="26_I" d="M 50,50 L 430,50 L 430,450 L 50,450 Z" />
    </svg>`;

    const result = parsePatternSvg(svgWithShorts, 'SHORT 26', 'FUTBOL', 'shorts.svg');
    expect(result.patternSet.sizes.length).toBe(1);

    const size26 = result.patternSet.sizes[0];
    expect(size26.sizeName).toBe('26');
    expect(size26.pieces.length).toBe(2);

    const pieceIzq = size26.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ');
    const pieceDer = size26.pieces.find((p) => p.pieceType === 'PANTALONETA_DER');

    expect(pieceIzq).toBeDefined();
    expect(pieceDer).toBeDefined();
    expect(pieceIzq?.originalElementId).toBe('26_I');
    expect(pieceDer?.originalElementId).toBe('26_D');
    expect(pieceIzq?.pieceName).toBe('T26_PANTALONETA_IZQ');
    expect(pieceDer?.pieceName).toBe('T26_PANTALONETA_DER');
  });

  it('debe empatar correctamente cuando las etiquetas 26_I y 26_D vienen como texto flotante <text> dentro del molde', () => {
    const svgWithTextLabels = `<?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1000mm" height="800mm" viewBox="0 0 1000 800">
      <!-- Molde Izquierdo con ID genérico -->
      <path id="trazado_izq" d="M 50,50 L 430,50 L 430,450 L 50,450 Z" />
      <text x="240" y="250">26_I</text>

      <!-- Molde Derecho con ID genérico -->
      <path id="trazado_der" d="M 500,50 L 880,50 L 880,450 L 500,450 Z" />
      <text x="690" y="250">26_D</text>
    </svg>`;

    const result = parsePatternSvg(svgWithTextLabels, 'SHORT 26 TEXT', 'FUTBOL', 'shorts_text.svg');
    const size26 = result.patternSet.sizes[0];

    const pieceIzq = size26.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ');
    const pieceDer = size26.pieces.find((p) => p.pieceType === 'PANTALONETA_DER');

    expect(pieceIzq).toBeDefined();
    expect(pieceDer).toBeDefined();
    expect(pieceIzq?.originalElementId).toBe('trazado_izq');
    expect(pieceDer?.originalElementId).toBe('trazado_der');
    expect(pieceIzq?.pieceName).toBe('T26_PANTALONETA_IZQ');
    expect(pieceDer?.pieceName).toBe('T26_PANTALONETA_DER');
  });

  it('debe clasificar la pieza izquierda en X como PANTALONETA_IZQ y la derecha en X como PANTALONETA_DER cuando no hay indicio de lado', () => {
    const svgWithoutSideLabels = `<?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1000mm" height="800mm" viewBox="0 0 1000 800">
      <!-- Pierna a la derecha en el lienzo (X=500..880) escrita primero en el XML -->
      <path id="T26_SHORT_1" d="M 500,50 L 880,50 L 880,450 L 500,450 Z" />
      <!-- Pierna a la izquierda en el lienzo (X=50..430) escrita segunda en el XML -->
      <path id="T26_SHORT_2" d="M 50,50 L 430,50 L 430,450 L 50,450 Z" />
    </svg>`;

    const result = parsePatternSvg(svgWithoutSideLabels, 'SHORT 26 SPATIAL', 'FUTBOL', 'shorts_spatial.svg');
    const size26 = result.patternSet.sizes[0];

    const pieceIzq = size26.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ');
    const pieceDer = size26.pieces.find((p) => p.pieceType === 'PANTALONETA_DER');

    expect(pieceIzq?.originalElementId).toBe('T26_SHORT_2');
    expect(pieceDer?.originalElementId).toBe('T26_SHORT_1');
  });

  it('debe parsear correctamente plantillas generadas con múltiples tallas donde los IDs tienen sufijo de talla y grupos transform translate', () => {
    const svgTemplate = `<?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="2000mm" height="2000mm" viewBox="0 0 2000 2000">
      <g id="LÍNEA_DE_CORTE">
        <g id="CORTE_DELANTERO_V_26" transform="translate(30.00, 30.00)">
          <path id="DELANTERO_V_26" d="M 0,0 L 300,0 L 300,500 L 0,500 Z" />
        </g>
        <g id="CORTE_ESPALDA_26" transform="translate(350.00, 30.00)">
          <path id="ESPALDA_26" d="M 0,0 L 300,0 L 300,500 L 0,500 Z" />
        </g>
        <g id="CORTE_DELANTERO_V_28" transform="translate(30.00, 600.00)">
          <path id="DELANTERO_V_28" d="M 0,0 L 320,0 L 320,530 L 0,530 Z" />
        </g>
        <g id="CORTE_ESPALDA_28" transform="translate(370.00, 600.00)">
          <path id="ESPALDA_28" d="M 0,0 L 320,0 L 320,530 L 0,530 Z" />
        </g>
      </g>
      <g id="TEXTOS_Y_REFERENCIAS">
        <text x="45.00" y="55.00">DELANTERO_V — TALLA 26</text>
        <text x="365.00" y="55.00">ESPALDA — TALLA 26</text>
        <text x="45.00" y="625.00">DELANTERO_V — TALLA 28</text>
        <text x="385.00" y="625.00">ESPALDA — TALLA 28</text>
      </g>
    </svg>`;

    const result = parsePatternSvg(svgTemplate, 'PLANTILLA TEST', 'FUTBOL', 'plantilla.svg');
    expect(result.patternSet.sizes.length).toBe(2);

    const size26 = result.patternSet.sizes.find(s => s.sizeName === '26');
    const size28 = result.patternSet.sizes.find(s => s.sizeName === '28');

    expect(size26).toBeDefined();
    expect(size28).toBeDefined();
    expect(size26?.pieces.length).toBe(2);
    expect(size28?.pieces.length).toBe(2);

    expect(size26?.pieces.find(p => p.pieceType === 'DELANTERO_V')).toBeDefined();
    expect(size26?.pieces.find(p => p.pieceType === 'ESPALDA')).toBeDefined();
    expect(size28?.pieces.find(p => p.pieceType === 'DELANTERO_V')).toBeDefined();
    expect(size28?.pieces.find(p => p.pieceType === 'ESPALDA')).toBeDefined();
  });

  it('no debe clasificar IDs sintéticos path_1, path_2 como tallas y debe usar etiquetas de texto flotantes', () => {
    const svgAnonymous = `<?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1000mm" height="800mm" viewBox="0 0 1000 800">
      <!-- Path sin id (se le asigna path_1 internamente). Texto 28_D cerca -->
      <path d="M 500,50 L 880,50 L 880,450 L 500,450 Z" />
      <text x="650" y="200">28_D</text>

      <!-- Path sin id (path_2). Texto 28_I cerca -->
      <path d="M 50,50 L 430,50 L 430,450 L 50,450 Z" />
      <text x="200" y="200">28_I</text>
    </svg>`;

    const result = parsePatternSvg(svgAnonymous, 'TEST ANONYMOUS', 'FUTBOL', 'anon.svg');
    // Debe haber 1 sola talla ("28") con 2 piezas (PANTALONETA_DER y PANTALONETA_IZQ), NUNCA tallas "1" y "2"
    expect(result.patternSet.sizes.length).toBe(1);
    expect(result.patternSet.sizes[0].sizeName).toBe('28');
    expect(result.patternSet.sizes[0].pieces.length).toBe(2);
    expect(result.patternSet.sizes[0].pieces.some(p => p.pieceType === 'PANTALONETA_DER')).toBe(true);
    expect(result.patternSet.sizes[0].pieces.some(p => p.pieceType === 'PANTALONETA_IZQ')).toBe(true);
  });
});

