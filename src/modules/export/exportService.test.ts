import { describe, it, expect } from 'vitest';
import { exportProductionRoll } from './exportService';
import { generateFullRollSvg } from './svgExporter';
import {
  buildPdfSourceSvg,
  calculatePdfPageGeometry,
  calculatePdfPiecePathPlacement,
  generateFullRollPdf,
  PDF_MAX_USER_SPACE_SIDE_PT,
} from './pdfExporter';
import { generateFullRollEps } from './epsExporter';
import { generateProductionExcel, generateProductionCsv } from './productionSummaryExporter';
import { PlacedNestingPiece, NestingResult } from '@/core/nesting/types';
import { mmToPt } from '@/core/units/units';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';

function createDummyPiece(
  id: string,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = '#facc15'
): PlacedNestingPiece {
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
    svgContent: `<g id="production_art_${id}"><rect width="${w}" height="${h}" fill="${fill}" /><text x="${w / 2}" y="40" text-anchor="middle">${name}</text><text x="${w / 2}" y="120" text-anchor="middle">10</text></g>`,
  };
}

function getPhysicalPageSize(pdf: PDFDocument): { widthPt: number; heightPt: number } {
  const page = pdf.getPage(0);
  const userUnitRef = page.node.get(PDFName.of('UserUnit'));
  const userUnitObject = userUnitRef ? pdf.context.lookup(userUnitRef) : undefined;
  const userUnit = userUnitObject instanceof PDFNumber ? userUnitObject.asNumber() : 1;

  return {
    widthPt: page.getWidth() * userUnit,
    heightPt: page.getHeight() * userUnit,
  };
}

describe('Motor de Exportación Vectorial 1:1 (PDF, SVG, EPS, Excel)', () => {
  const pieces: PlacedNestingPiece[] = [
    createDummyPiece('p1', 'MATEO', 0, 0, 520, 710),
    createDummyPiece('p2', 'CARLOS', 527, 0, 520, 710, '#16a34a'),
  ];
  const piecesWithoutArtwork = pieces.map((piece) => ({
    ...piece,
    svgContent: undefined,
  }));

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
    expect(svg).toContain('production_art_p1');
    expect(svg).toContain('fill="#facc15"');
    expect(svg).toContain('fill="#16a34a"');
    expect(svg).toContain('MATEO');
    expect(svg).toContain('CARLOS');
    expect(svg).not.toContain('Trazo de corte exterior');
    expect(svg).not.toContain('stroke="#ff0000"');
    expect(svg).not.toContain('y="-3.5"');
  });

  it('QA 7.3 & 8.1: Exportación PDF para RasterLink: genera archivo binario válido a escala exacta en puntos PostScript', async () => {
    const pdfBytes = await generateFullRollPdf(piecesWithoutArtwork, 1120.0, 710.0);

    expect(pdfBytes).toBeDefined();
    // En Node se ejercita el fallback geométrico (pdf-lib): PDF válido pero
    // compacto. El tamaño real lo define la conversión de arte en el navegador.
    expect(pdfBytes.length).toBeGreaterThan(0); // Archivo PDF completo

    // Encabezado estándar de PDF
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');

    // Verificar correspondencia de unidades matemáticas
    const expectedWidthPt = mmToPt(1120.0);
    const expectedHeightPt = mmToPt(710.0);
    expect(expectedWidthPt).toBeCloseTo(3174.80, 1);
    expect(expectedHeightPt).toBeCloseTo(2012.60, 1);

    const parsedPdf = await PDFDocument.load(pdfBytes);
    expect(parsedPdf.getPageCount()).toBe(1);
    const physicalSize = getPhysicalPageSize(parsedPdf);
    expect(physicalSize.widthPt).toBeCloseTo(expectedWidthPt, 3);
    expect(physicalSize.heightPt).toBeCloseTo(expectedHeightPt, 3);
  });

  it('PDF con arte deriva del mismo SVG limpio y nunca sustituye el diseño por siluetas', async () => {
    const options = {
      includeCutContour: false,
      includeSeamLabels: false,
    };
    const illustratorSvg = generateFullRollSvg(pieces, 1120, 710, options);
    const pdfSourceSvg = buildPdfSourceSvg(pieces, 1120, 710, options);

    expect(pdfSourceSvg).toBe(illustratorSvg);
    expect(pdfSourceSvg).toContain('fill="#facc15"');
    expect(pdfSourceSvg).toContain('fill="#16a34a"');
    expect(pdfSourceSvg).toContain('MATEO');
    expect(pdfSourceSvg).toContain('CARLOS');
    expect(pdfSourceSvg).not.toContain('stroke="#ff0000"');

    // Vitest corre sin DOM. Un fallo de conversión debe ser explícito; jamás
    // debe devolver el antiguo PDF de siluetas oscuras perdiendo el arte.
    await expect(generateFullRollPdf(pieces, 1120, 710, options))
      .rejects.toThrow(/PDF_SVG_RENDERER_UNAVAILABLE/);
  });

  it('PDF de rollo largo mantiene 1:1 aun al superar el límite clásico de 14.400 pt', async () => {
    const longRollMm = 6830;
    const geometry = calculatePdfPageGeometry(1120, longRollMm);
    expect(geometry.userUnit).toBeGreaterThan(1);
    expect(geometry.mediaBoxWidthPt).toBeLessThanOrEqual(PDF_MAX_USER_SPACE_SIDE_PT);
    expect(geometry.mediaBoxHeightPt).toBeLessThanOrEqual(PDF_MAX_USER_SPACE_SIDE_PT);

    const pdfBytes = await generateFullRollPdf(piecesWithoutArtwork, 1120, longRollMm);
    const parsedPdf = await PDFDocument.load(pdfBytes);
    const physicalSize = getPhysicalPageSize(parsedPdf);

    expect(physicalSize.widthPt).toBeCloseTo(mmToPt(1120), 3);
    expect(physicalSize.heightPt).toBeCloseTo(mmToPt(longRollMm), 3);
  });

  it.each([90, 180, 270])(
    'PDF mantiene una pieza rotada %i° dentro de su posición de nesting',
    (rotationDeg) => {
      const source = createDummyPiece('rotated', 'MATEO', 37, 41, 120, 80);
      const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;
      const piece: PlacedNestingPiece = {
        ...source,
        svgContent: undefined,
        rotationDeg,
        effectiveWidthMm: isQuarterTurn ? source.bbox.height : source.bbox.width,
        effectiveHeightMm: isQuarterTurn ? source.bbox.width : source.bbox.height,
      };
      const geometry = calculatePdfPageGeometry(1120, 710);
      const placement = calculatePdfPiecePathPlacement(piece, geometry);

      expect(placement).not.toBeNull();
      expect(placement!.xPt).toBe(0);
      expect(placement!.yPt).toBe(geometry.mediaBoxHeightPt);

      const xs = placement!.points.map((point) => point.x);
      const ys = placement!.points.map((point) => point.y);
      expect(Math.min(...xs)).toBeCloseTo(mmToPt(piece.xMm), 3);
      expect(Math.max(...xs)).toBeCloseTo(
        mmToPt(piece.xMm + piece.effectiveWidthMm),
        3
      );
      expect(Math.min(...ys)).toBeCloseTo(mmToPt(piece.yMm), 3);
      expect(Math.max(...ys)).toBeCloseTo(
        mmToPt(piece.yMm + piece.effectiveHeightMm),
        3
      );
      expect(Math.max(...xs)).toBeLessThanOrEqual(geometry.mediaBoxWidthPt);
      expect(Math.max(...ys)).toBeLessThanOrEqual(geometry.mediaBoxHeightPt);
    }
  );

  it('Exportación EPS Level 3: BoundingBox e HiResBoundingBox correctos en puntos PostScript', () => {
    const eps = generateFullRollEps(pieces, 1120.0, 710.0);

    expect(eps).toContain('%!PS-Adobe-3.0 EPSF-3.0');
    expect(eps).toContain('%%BoundingBox: 0 0 3175 2013');
    expect(eps).toContain('%%HiResBoundingBox: 0.0000 0.0000 3174.8031 2012.5984');
    expect(eps).toContain('/Helvetica-Bold');
    expect(eps).not.toContain('1.0 0.0 0.0 rgb stroke');
    expect(eps).not.toContain('findfont 8.5 scalefont');
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
    const payloadWithoutArtwork = {
      ...payload,
      placedPieces: piecesWithoutArtwork,
      nestingResult: {
        ...nestingResult,
        placedPieces: piecesWithoutArtwork,
      },
    };
    const res = await exportProductionRoll(payloadWithoutArtwork, {
      format: 'PDF',
      fileName: 'BOBINA_1120MM',
      ripProfile: 'MIMAKI_RASTERLINK',
      includeCutContour: false,
      cutContourColor: '#ff0000',
      cutContourWidthMm: 0.25,
      includeSeamLabels: false,
      paperRollWidthMm: 1120.0,
      totalRollLengthMm: 710.0,
    });

    expect(res.fileName).toBe('BOBINA_1120MM.pdf');
    expect(res.mimeType).toBe('application/pdf');
    expect(res.widthMm).toBe(1120.0);
    expect(res.heightMm).toBe(710.0);
    expect(res.totalPieces).toBe(2);
    expect(res.fileSizeBytes).toBeGreaterThan(0);
  });
});
