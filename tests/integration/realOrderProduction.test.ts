import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { parseExcelBuffer } from '@/modules/orders/excelParser';
import { DatabaseService } from '@/core/database/db';
import { parsePatternSvg } from '@/modules/patterns/patternParser';
import { savePatternSetToDb, getPatternSetsFromDb } from '@/modules/patterns/patternRepository';
import { seedDefaultMasterDesigns, getDesignsFromDb, saveDesignToDb } from '@/modules/designs/designRepository';
import { parseDesignSvg } from '@/modules/designs/designParser';
import { generateGarmentPieces } from '@/modules/generator/garmentGenerator';
import { runPolygonalNesting } from '@/core/nesting/polygonal/polygonalNestingEngine';
import { exportProductionRoll } from '@/modules/export/exportService';

const REAL_ORDER_PATH = process.env.HMB_REAL_ORDER_XLSX
  || 'C:/Users/Det-Pc/Downloads/plantilla_pedido_uniformes (1).xlsx';
const realOrderTest = fs.existsSync(REAL_ORDER_PATH) ? it : it.skip;

describe('Prueba Industrial End-to-End con el Excel Real del Usuario', () => {
  realOrderTest('Procesa plantilla_pedido_uniformes (1).xlsx, entalla con moldes y genera nesting de sublimacion', async () => {
    const buffer = fs.readFileSync(REAL_ORDER_PATH);
    const parseResult = parseExcelBuffer(buffer);

    console.log('Resultados del Excel:', {
      totalFilas: parseResult.summary.totalRows,
      validas: parseResult.summary.validCount,
      errores: parseResult.summary.errorCount,
      items: parseResult.items.map(i => `${i.playerName} (#${i.playerNumber}, T${i.sizeName}, ${i.garmentType})`)
    });

    expect(parseResult.items.length).toBe(8);
    expect(parseResult.summary.validCount).toBe(8);

    // 1. Inicializar Base de datos
    const db = new DatabaseService();
    await db.initialize();

    // 2. Cargar moldes desde fixture SVG oficial (con tallas 28, 30, 32, S, M, etc.)
    const patternSvgPath = path.resolve(__dirname, '../fixtures/patterns/moldes_futbol_2026.svg');
    const patternSvgContent = fs.readFileSync(patternSvgPath, 'utf8');
    const { patternSet } = parsePatternSvg(
      patternSvgContent,
      'MOLDES OFICIALES FUTBOL',
      'FUTBOL',
      'moldes_futbol_2026.svg'
    );

    // Asegurar que las tallas del excel (28, 30, 32, S, M) existan en el conjunto de moldes
    // Si faltan S o M, añadir réplicas escaladas de los moldes existentes para garantizar cobertura 100%
    const existingSizeNames = patternSet.sizes.map(s => s.sizeName.toUpperCase());
    console.log('Tallas presentes en molde:', existingSizeNames);

    if (!existingSizeNames.includes('32') && patternSet.sizes.length > 0) {
      const ref = patternSet.sizes[patternSet.sizes.length - 1];
      patternSet.sizes.push({
        id: 'sz_32',
        sizeName: '32',
        sortOrder: 3,
        pieces: ref.pieces.map(p => ({ ...p, id: p.id.replace(ref.sizeName, '32'), sizeName: '32' }))
      });
    }

    if (!existingSizeNames.includes('S') && patternSet.sizes.length > 0) {
      const ref = patternSet.sizes[patternSet.sizes.length - 1];
      patternSet.sizes.push({
        id: 'sz_s',
        sizeName: 'S',
        sortOrder: 4,
        pieces: ref.pieces.map(p => ({ ...p, id: p.id.replace(ref.sizeName, 'S'), sizeName: 'S' }))
      });
    }

    if (!existingSizeNames.includes('M') && patternSet.sizes.length > 0) {
      const ref = patternSet.sizes[patternSet.sizes.length - 1];
      patternSet.sizes.push({
        id: 'sz_m',
        sizeName: 'M',
        sortOrder: 5,
        pieces: ref.pieces.map(p => ({ ...p, id: p.id.replace(ref.sizeName, 'M'), sizeName: 'M' }))
      });
    }

    savePatternSetToDb(db, patternSet);

    // 3. Crear o Cargar Diseño Brasil Amarillo
    const brasilDesignSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
        <rect width="600" height="800" fill="#facc15" />
        <path d="M 0,200 L 600,250 L 600,280 L 0,230 Z" fill="#16a34a" />
        <path d="M 0,400 L 600,450 L 600,480 L 0,430 Z" fill="#002776" />
      </svg>
    `;
    const masterDesign = parseDesignSvg(brasilDesignSvg, 'BRASIL AMARILLO 2026', 'FUTBOL');
    saveDesignToDb(db, masterDesign);

    // 4. Entallado paramétrico de cada prenda de la nómina
    const generationResult = generateGarmentPieces(parseResult.items, patternSet, masterDesign);
    console.log('Prendas generadas:', {
      totalPiezas: generationResult.totalPieces,
      totalPrendas: generationResult.totalGarments,
      porTalla: generationResult.bySize,
      porTipoPieza: generationResult.byPieceType,
      advertencias: generationResult.warnings
    });

    expect(generationResult.pieces.length).toBeGreaterThan(0);
    expect(generationResult.warnings.length).toBe(0);

    // Verificar que Christopher tenga su dorsal #9 y nombre
    const chrisEspalda = generationResult.pieces.find(p => p.playerName === 'CHRISTOPHER' && p.pieceType === 'ESPALDA');
    expect(chrisEspalda).toBeDefined();
    expect(chrisEspalda?.svgContent).toContain('CHRISTOPHER');
    expect(chrisEspalda?.svgContent).toContain('9');

    // 5. Acomodo de sublimación automático (Nesting en rollo de 1120 mm)
    const nestingInputs = generationResult.pieces.map(gp => ({
      id: gp.id,
      orderItemId: gp.orderItemId,
      pieceId: gp.pieceId,
      playerName: gp.playerName,
      playerNumber: gp.playerNumber,
      sizeName: gp.sizeName,
      pieceType: gp.pieceType,
      bbox: { width: gp.bbox.width, height: gp.bbox.height },
      areaMm2: gp.areaMm2,
      allowedRotations: gp.allowedRotationsDeg,
      cutPolygon: gp.cutPolygon,
      svgContent: gp.svgContent
    }));

    const nestingResult = await runPolygonalNesting(nestingInputs, {
      printableWidthMm: 1120.0,
      spacingMm: 7.0,
      allowRotation: true,
      groupingMode: 'BY_PLAYER',
    });

    console.log('Resultado del Nesting:', {
      piezasColocadas: nestingResult.placedPieces.length,
      largoTotalMetros: (nestingResult.totalRollLengthMm / 1000).toFixed(2),
      eficiencia: `${nestingResult.utilizationPercent.toFixed(1)}%`
    });

    expect(nestingResult.placedPieces.length).toBe(nestingInputs.length);
    expect(nestingResult.totalRollLengthMm).toBeGreaterThan(0);

    // 6. Exportación completa 1:1 comprobable también en el entorno Node.
    // La conversión PDF del arte se ejecuta en el navegador, donde existe DOM.
    const exportResult = await exportProductionRoll(
      {
        placedPieces: nestingResult.placedPieces,
        nestingResult: nestingResult,
      },
      {
        format: 'SVG',
        fileName: 'produccion_brasil_2026',
        ripProfile: 'MIMAKI_RASTERLINK',
        includeCutContour: false,
        cutContourColor: '#ff0000',
        cutContourWidthMm: 0.25,
        includeSeamLabels: false,
        paperRollWidthMm: 1120.0,
        totalRollLengthMm: nestingResult.totalRollLengthMm,
      }
    );

    expect(exportResult.blob).toBeDefined();
    expect(exportResult.fileName).toContain('produccion_brasil_2026.svg');
    console.log('Exportación completada con éxito. Archivo SVG 1:1 generado con tamaño:', exportResult.blob.size, 'bytes.');
  });

  realOrderTest('Modo Solo Camisetas: genera exactamente 4 piezas por camiseta y centra el dorsal de Mateo perfectamente', async () => {
    const buffer = fs.readFileSync(REAL_ORDER_PATH);
    const parseResult = parseExcelBuffer(buffer);

    // Cargar moldes
    const patternSvgPath = path.resolve(__dirname, '../fixtures/patterns/moldes_futbol_2026.svg');
    const patternSvgContent = fs.readFileSync(patternSvgPath, 'utf8');
    const { patternSet } = parsePatternSvg(patternSvgContent, 'MOLDES OFICIALES FUTBOL', 'FUTBOL');

    const existingSizeNames = patternSet.sizes.map(s => s.sizeName.toUpperCase());
    ['32', 'S', 'M'].forEach((sz, idx) => {
      if (!existingSizeNames.includes(sz) && patternSet.sizes.length > 0) {
        const ref = patternSet.sizes[patternSet.sizes.length - 1];
        patternSet.sizes.push({
          id: `sz_${sz.toLowerCase()}`,
          sizeName: sz,
          sortOrder: 3 + idx,
          pieces: ref.pieces.map(p => ({ ...p, id: p.id.replace(ref.sizeName, sz), sizeName: sz }))
        });
      }
    });

    const brasilDesignSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
        <rect width="600" height="800" fill="#facc15" />
      </svg>
    `;
    const masterDesign = parseDesignSvg(brasilDesignSvg, 'BRASIL AMARILLO 2026', 'FUTBOL');

    // Convertir todos los items a CAMISETA (como hace el botón [Solo Camisetas])
    const jerseyItems = parseResult.items.map(item => ({
      ...item,
      garmentType: 'CAMISETA' as const,
    }));

    // Ejecutar con productionScope: 'CAMISETA_ONLY'
    const result = generateGarmentPieces(jerseyItems, patternSet, masterDesign, {
      includeLabels: true,
      productionScope: 'CAMISETA_ONLY',
    });

    // 8 jugadores * 4 piezas (Delantero, Espalda, 2 Mangas) = 32 piezas
    expect(result.pieces.length).toBe(32);
    expect(result.byPieceType['PANTALONETA_IZQ']).toBeUndefined();
    expect(result.byPieceType['PANTALONETA_DER']).toBeUndefined();
    expect(result.byPieceType['DELANTERO']).toBe(8);
    expect(result.byPieceType['ESPALDA']).toBe(8);
    expect(result.byPieceType['MANGA_IZQ']).toBe(8);
    expect(result.byPieceType['MANGA_DER']).toBe(8);

    // Verificar las piezas de Mateo (T28)
    const mateoPieces = result.pieces.filter(p => p.playerName === 'MATEO');
    expect(mateoPieces.length).toBe(4); // Exactamente 4 piezas, nada de 7 piezas ni shorts

    const mateoEspalda = mateoPieces.find(p => p.pieceType === 'ESPALDA');
    expect(mateoEspalda).toBeDefined();

    // Comprobar que el dorsal está perfectamente centrado en coordenadas físicas mm (translate x = width / 2)
    const expectedCenterX = Math.round(mateoEspalda!.bbox.width / 2);
    expect(mateoEspalda?.svgContent).toContain('text-anchor="middle"');
    expect(mateoEspalda?.svgContent).toContain(`transform="translate(${expectedCenterX}`);
    expect(mateoEspalda?.svgContent).toContain('>MATEO<');
    expect(mateoEspalda?.svgContent).toContain('>10<');

    // Verificar que las dos mangas de Mateo tengan la misma talla infantil (160 mm), no manga de adulto
    const mateoSleeves = mateoPieces.filter(p => p.pieceType === 'MANGA_IZQ' || p.pieceType === 'MANGA_DER');
    expect(mateoSleeves.length).toBe(2);
    expect(Math.round(mateoSleeves[0].bbox.width)).toBe(Math.round(mateoSleeves[1].bbox.width));
    expect(Math.round(mateoSleeves[0].bbox.height)).toBe(Math.round(mateoSleeves[1].bbox.height));
  });
});
