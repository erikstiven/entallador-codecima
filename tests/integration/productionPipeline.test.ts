import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { parseExcelBuffer } from '@/modules/orders/excelParser';
import { DatabaseService } from '@/core/database/db';
import { parsePatternSvg } from '@/modules/patterns/patternParser';
import { savePatternSetToDb, getPatternSetsFromDb } from '@/modules/patterns/patternRepository';
import { seedDefaultMasterDesigns, getDesignsFromDb } from '@/modules/designs/designRepository';
import { generateGarmentPieces } from '@/modules/generator/garmentGenerator';
import { runPolygonalNesting } from '@/core/nesting/polygonal/polygonalNestingEngine';
import { checkPolygonsOverlap, calculatePolygonalIntersectionArea } from '@/core/geometry/clipperService';
import { getOrientedPolygon, computeBoundingBox } from '@/core/geometry/transform';
import { generateFullRollPdf } from '@/modules/export/pdfExporter';
import { generateFullRollSvg } from '@/modules/export/svgExporter';
import { generateFullRollEps } from '@/modules/export/epsExporter';
import { generateProductionExcel, generateProductionCsv } from '@/modules/export/productionSummaryExporter';
import { exportProductionRoll } from '@/modules/export/exportService';
import { mmToPt } from '@/core/units/units';

describe('FASE 10 — QA Exhaustivo y Pipeline de Producción End-to-End (E2E)', () => {
  it('Flujo Industrial Completo: Excel con Tildes/Ñ -> Moldes -> Diseño -> Generador -> Nesting Clipper2 -> Exportación PDF/SVG/EPS 1:1', async () => {
    // -------------------------------------------------------------------------
    // 1. INGESTIÓN DE PEDIDO REAL CON CARACTERES ESPECIALES (Tildes, Eñes, Nombres Largos)
    // -------------------------------------------------------------------------
    const csvPath = path.resolve(__dirname, '../fixtures/excel/pedido_tildes_y_enie.csv');
    expect(fs.existsSync(csvPath)).toBe(true);

    const buffer = fs.readFileSync(csvPath);
    const parseResult = parseExcelBuffer(buffer, {
      availableSizes: ['28', '30', '32', 'S', 'M', 'L'],
    });
    expect(parseResult.items.length).toBeGreaterThan(0);
    expect(parseResult.summary.validCount).toBeGreaterThan(0);

    const validPlayers = parseResult.items.filter((it) => it.isValid);
    expect(validPlayers.length).toBeGreaterThan(0);

    // Verificar que se hayan leído nombres especiales
    const playerNames = validPlayers.map((item) => item.playerName);
    expect(playerNames.some((n) => n.includes('Á') || n.includes('Ñ'))).toBe(true);

    // -------------------------------------------------------------------------
    // 2. CONEXIÓN A BASE DE DATOS Y CARGA DE MOLDES Y DISEÑOS OFICIALES
    // -------------------------------------------------------------------------
    const db = new DatabaseService();
    await db.initialize();

    // Cargar moldes desde fixture SVG oficial y persistirlos en SQLite
    const patternSvgPath = path.resolve(__dirname, '../fixtures/patterns/moldes_futbol_2026.svg');
    expect(fs.existsSync(patternSvgPath)).toBe(true);
    const patternSvgContent = fs.readFileSync(patternSvgPath, 'utf8');
    const { patternSet: parsedPatternSet } = parsePatternSvg(
      patternSvgContent,
      'MOLDES FUTBOL OFICIAL 2026',
      'FUTBOL',
      'moldes_futbol_2026.svg'
    );
    savePatternSetToDb(db, parsedPatternSet);

    // Sembrar diseños iniciales
    seedDefaultMasterDesigns(db);

    const patternSets = getPatternSetsFromDb(db);
    expect(patternSets.length).toBeGreaterThan(0);

    const patternSet = patternSets.find((ps) => ps.name.includes('FUTBOL')) || patternSets[0];
    expect(patternSet.sizes.length).toBeGreaterThan(0);

    const designs = getDesignsFromDb(db);
    expect(designs.length).toBeGreaterThan(0);
    const masterDesign = designs[0];

    // -------------------------------------------------------------------------
    // 3. GENERACIÓN AUTOMÁTICA DE PRENDAS PARAMÉTRICAS (MOLDE + DISEÑO + JUGADOR)
    // -------------------------------------------------------------------------
    // Tomamos los primeros 2 jugadores validados para una prueba de taller rigurosa
    const testPlayers = validPlayers.slice(0, 2);
    const generationResult = generateGarmentPieces(testPlayers, patternSet, masterDesign);

    expect(generationResult.pieces.length).toBeGreaterThan(0);
    expect(generationResult.totalGarments).toBe(2);

    // Cada pieza debe contar con clipPath vectorial y etiquetas de confección legibles
    for (const piece of generationResult.pieces) {
      expect(piece.cutPolygon.length).toBeGreaterThanOrEqual(3);
      expect(piece.bbox.width).toBeGreaterThan(0);
      expect(piece.bbox.height).toBeGreaterThan(0);
      expect(piece.label.text).toContain(piece.playerName);
      expect(piece.label.text).toContain(piece.sizeName);
    }

    // -------------------------------------------------------------------------
    // 4. MOTOR DE NESTING AVANZADO POLIGONAL (CLIPPER2 WASM)
    // -------------------------------------------------------------------------
    const printableWidthMm = 1120.0; // Ancho útil estándar para plotter Epson en rollo 122cm
    const spacingMm = 7.0; // Margen de seguridad estricto de taller

    const nestingPiecesInput = generationResult.pieces.map((gp) => ({
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
      svgContent: gp.svgContent,
    }));

    const nestingResult = await runPolygonalNesting(nestingPiecesInput, {
      printableWidthMm,
      spacingMm,
      groupingMode: 'MAX_SAVINGS',
    });

    expect(nestingResult.placedPieces.length).toBe(generationResult.pieces.length);
    expect(nestingResult.totalRollLengthMm).toBeGreaterThan(0);
    expect(nestingResult.utilizationPercent).toBeGreaterThan(40);
    expect(nestingResult.wastePercent).toBeGreaterThanOrEqual(0);

    // -------------------------------------------------------------------------
    // 5. QA 13.2.1: CONTENCIÓN ESTRICTA EN EL ANCHO ÚTIL (xi + wi <= 1120 mm)
    // -------------------------------------------------------------------------
    for (const piece of nestingResult.placedPieces) {
      expect(piece.xMm).toBeGreaterThanOrEqual(0);
      expect(piece.xMm + piece.effectiveWidthMm).toBeLessThanOrEqual(printableWidthMm + 0.05);
      expect(piece.yMm).toBeGreaterThanOrEqual(0);
    }

    // -------------------------------------------------------------------------
    // 6. QA 13.2.2: CERTIFICACIÓN DE NO-SOLAPAMIENTO CON CLIPPER2 (ÁREA = 0.00 mm²)
    // -------------------------------------------------------------------------
    const placed = nestingResult.placedPieces;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];

        const polyA = getOrientedPolygon(a.cutPolygon, a.rotationDeg, a.xMm, a.yMm);
        const polyB = getOrientedPolygon(b.cutPolygon, b.rotationDeg, b.xMm, b.yMm);

        const overlaps = await checkPolygonsOverlap(polyA, polyB);
        const overlapArea = await calculatePolygonalIntersectionArea(polyA, polyB);

        expect(overlaps).toBe(false);
        expect(overlapArea).toBe(0.0);
      }
    }

    // -------------------------------------------------------------------------
    // 7. QA 13.3: VERIFICACIÓN DIMENSIONAL DE CORTE REAL (< 0.1 mm de tolerancia)
    // -------------------------------------------------------------------------
    for (const placedPiece of nestingResult.placedPieces) {
      const original = generationResult.pieces.find((p) => p.id === placedPiece.id);
      expect(original).toBeDefined();

      const isRotated90or270 = placedPiece.rotationDeg === 90 || placedPiece.rotationDeg === 270;
      const expectedW = isRotated90or270 ? original!.bbox.height : original!.bbox.width;
      const expectedH = isRotated90or270 ? original!.bbox.width : original!.bbox.height;

      // Tolerancia física absoluta < 0.1 mm
      expect(Math.abs(placedPiece.effectiveWidthMm - expectedW)).toBeLessThan(0.1);
      expect(Math.abs(placedPiece.effectiveHeightMm - expectedH)).toBeLessThan(0.1);
    }

    // -------------------------------------------------------------------------
    // 8. QA 7.2 & 8.1: EXPORTACIÓN VECTORIAL 1:1 (PDF, SVG, EPS, EXCEL, CSV)
    // -------------------------------------------------------------------------
    const totalRollLength = nestingResult.totalRollLengthMm;

    // A. SVG para Illustrator
    const svgOutput = generateFullRollSvg(placed, printableWidthMm, totalRollLength);
    expect(svgOutput).toContain(`width="${printableWidthMm.toFixed(2)}mm"`);
    expect(svgOutput).toContain(`height="${totalRollLength.toFixed(2)}mm"`);
    expect(svgOutput).toContain(`viewBox="0 0 ${printableWidthMm.toFixed(2)} ${totalRollLength.toFixed(2)}"`);
    expect(svgOutput).toContain('clipPath');
    expect(svgOutput).toContain('stroke="#ff0000"'); // CutContour rojo para plotter de corte

    // B. PDF para Mimaki RasterLink / Epson Edge Print
    const pdfOutput = await generateFullRollPdf(placed, printableWidthMm, totalRollLength);
    expect(pdfOutput).toBeDefined();
    expect(pdfOutput.length).toBeGreaterThan(1500);

    const pdfHeader = String.fromCharCode(...pdfOutput.slice(0, 5));
    expect(pdfHeader).toBe('%PDF-');

    // C. EPS PostScript Level 3
    const epsOutput = generateFullRollEps(placed, printableWidthMm, totalRollLength);
    expect(epsOutput).toContain('%!PS-Adobe-3.0 EPSF-3.0');
    expect(epsOutput).toContain(`%%HiResBoundingBox: 0.0000 0.0000 ${mmToPt(printableWidthMm).toFixed(4)} ${mmToPt(totalRollLength).toFixed(4)}`);

    // D. Planilla Excel de Corte
    const excelPayload = {
      placedPieces: placed,
      nestingResult,
      projectName: 'UNIFORMES_QA_OFICIAL_2026',
      clientName: 'TALLER DE SUBLIMACION',
    };

    const excelBytes = generateProductionExcel(excelPayload);
    expect(excelBytes.length).toBeGreaterThan(2500);

    // E. CSV con UTF-8 BOM
    const csvOutput = generateProductionCsv(excelPayload);
    expect(csvOutput.charCodeAt(0)).toBe(0xFEFF); // BOM UTF-8
    expect(csvOutput).toContain('Talla');
    expect(csvOutput).toContain('X_mm');

    // F. Servicio central unificado
    const exportResult = await exportProductionRoll(excelPayload, {
      format: 'PDF',
      fileName: 'BOBINA_FINAL_RASTERLINK',
      ripProfile: 'MIMAKI_RASTERLINK',
      includeCutContour: true,
      cutContourColor: '#ff0000',
      cutContourWidthMm: 0.25,
      includeSeamLabels: true,
      paperRollWidthMm: printableWidthMm,
      totalRollLengthMm: totalRollLength,
    });

    expect(exportResult.fileName).toBe('BOBINA_FINAL_RASTERLINK.pdf');
    expect(exportResult.fileSizeBytes).toBeGreaterThan(1000);
    expect(exportResult.widthMm).toBe(1120.0);
    expect(exportResult.heightMm).toBe(totalRollLength);

    db.close();
  });
});
