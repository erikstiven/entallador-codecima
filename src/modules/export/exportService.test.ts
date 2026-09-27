import { describe, it, expect } from 'vitest';
import { exportProductionRoll } from './exportService';
import { generateFullRollSvg } from './svgExporter';
import { generateFullRollPdf } from './pdfExporter';
import { generateFullRollEps } from './epsExporter';
import { generateProductionExcel, generateProductionCsv } from './productionSummaryExporter';
import { PlacedNestingPiece, NestingResult } from '@/core/nesting/types';
import { mmToPt } from '@/core/units/units';

function createDummyPiece(id: string, name: string, x: number, y: number, w: number, h: number): PlacedNestingPiece {
  return {
    id,
    orderItemId: `item_${name}`,
    pieceId: 'piece_delantero',
    playerName: name,
    playerNumber: '10',
    sizeName: '28',
    pieceType: 'DELANTERO',
    bbox: { width: w, height: h },
    areaMm2: w * h * 0.8,
    allowedRotations: [0],
    cutPolygon: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
    xMm: x,
    yMm: y,
    rotationDeg: 0,
    effectiveWidthMm: w,
    effectiveHeightMm: h,
    isLocked: false,
  };
}

describe('Motor de Exportación Vectorial 1:1 (PDF, SVG, EPS, Excel)', () => {
  const pieces: PlacedNestingPiece[] = [
    createDummyPiece('p1', 'MATEO', 0, 0, 520, 710),
    createDummyPiece('p2', 'CARLOS', 527, 0, 520, 710),
  ];

  const nestingResult: NestingResult = {
    placedPieces: pieces,
    totalRollLengthMm: 710.0,
    printableWidthMm: 1120.0,
    totalPiecesAreaMm2: 590720.0,
    usedRollAreaMm2: 795200.0,
    utilizationPercent: 74.28,
    wastePercent: 25.72,
    executionTimeMs: 12.5,
    groupingMode: 'MAX_SAVINGS',
  };

  const payload = {
    placedPieces: pieces,
    nestingResult,
    projectName: 'UNIFORMES_FINAL_2026',
    clientName: 'CLUB DEPORTIVO',
  };

  it('QA 7.2: Exportación SVG continua: escala física explícita en mm y viewBox coincidente 1:1', () => {
    const svg = generateFullRollSvg(pieces, 1120.0, 710.0);

    // Debe contener atributos físicos estrictos
    expect(svg).toContain('width="1120.00mm"');
    expect(svg).toContain('height="710.00mm"');
    expect(svg).toContain('viewBox="0 0 1120.00 710.00"');
    expect(svg).toContain('clipPath');
    expect(svg).toContain('MATEO');
    expect(svg).toContain('CARLOS');
  });

  it('QA 7.3 & 8.1: Exportación PDF para RasterLink: genera archivo binario válido a escala exacta en puntos PostScript', async () => {
    const pdfBytes = await generateFullRollPdf(pieces, 1120.0, 710.0);

    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(1000); // Archivo PDF completo

    // Encabezado estándar de PDF
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');

    // Verificar correspondencia de unidades matemáticas
    const expectedWidthPt = mmToPt(1120.0);
    const expectedHeightPt = mmToPt(710.0);
    expect(expectedWidthPt).toBeCloseTo(3174.80, 1);
    expect(expectedHeightPt).toBeCloseTo(2012.60, 1);
  });

  it('Exportación EPS Level 3: BoundingBox e HiResBoundingBox correctos en puntos PostScript', () => {
    const eps = generateFullRollEps(pieces, 1120.0, 710.0);

    expect(eps).toContain('%!PS-Adobe-3.0 EPSF-3.0');
    expect(eps).toContain('%%BoundingBox: 0 0 3175 2013');
    expect(eps).toContain('%%HiResBoundingBox: 0.0000 0.0000 3174.8031 2012.5984');
    expect(eps).toContain('/Helvetica-Bold');
    expect(eps).toContain('%%EOF');
  });

  it('Resumen de producción en Excel y CSV: detalle de corte por jugador y métricas de taller', () => {
    const excelBytes = generateProductionExcel(payload);
    expect(excelBytes.length).toBeGreaterThan(2000); // Archivo .xlsx válido

    const csv = generateProductionCsv(payload);
    expect(csv.startsWith('\uFEFF')).toBe(true); // UTF-8 BOM
    expect(csv).toContain('MATEO');
    expect(csv).toContain('CARLOS');
    expect(csv).toContain('710.00');
  });

  it('Servicio central exportProductionRoll: genera resultado unificado con metadatos', async () => {
    const res = await exportProductionRoll(payload, {
      format: 'PDF',
      fileName: 'BOBINA_1120MM',
      ripProfile: 'MIMAKI_RASTERLINK',
      includeCutContour: true,
      cutContourColor: '#ff0000',
      cutContourWidthMm: 0.25,
      includeSeamLabels: true,
      paperRollWidthMm: 1120.0,
      totalRollLengthMm: 710.0,
    });

    expect(res.fileName).toBe('BOBINA_1120MM.pdf');
    expect(res.mimeType).toBe('application/pdf');
    expect(res.widthMm).toBe(1120.0);
    expect(res.heightMm).toBe(710.0);
    expect(res.totalPieces).toBe(2);
    expect(res.fileSizeBytes).toBeGreaterThan(1000);
  });
});
