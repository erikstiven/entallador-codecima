import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportProductionRoll } from '../../src/modules/export/exportService';
import { generateFullRollSvg } from '../../src/modules/export/svgExporter';
import { PlacedNestingPiece, NestingResult } from '../../src/core/nesting/types';
import { mmToPt } from '../../src/core/units/units';

function createDummyPieceWithPlayer(
  id: string,
  playerName: string,
  playerNumber: string,
  x: number,
  y: number,
  w: number,
  h: number
): PlacedNestingPiece {
  return {
    id,
    orderItemId: `item_${playerName}`,
    pieceId: 'piece_delantero',
    playerName,
    playerNumber,
    sizeName: 'M',
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
    svgContent: `
      <g id="art_${id}">
        <defs>
          <linearGradient id="grad_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#0000ff" />
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#grad_${id})" />
        <text x="${w / 2}" y="50" font-family="Arial" font-size="20">${playerName}</text>
        <text x="${w / 2}" y="120" font-family="Arial" font-size="40">${playerNumber}</text>
      </g>
    `,
  };
}

describe('Integración de Exportación EPS de Alta Fidelidad (SVG -> EPS)', () => {
  const piecesWithSpecialChars: PlacedNestingPiece[] = [
    createDummyPieceWithPlayer('p1', 'MUÑOZ', '10', 0, 0, 520, 710),
    createDummyPieceWithPlayer('p2', 'ÁNGEL', '7', 530, 0, 520, 710),
    createDummyPieceWithPlayer('p3', 'JOSÉ PEÑA', '9', 0, 720, 520, 710),
    createDummyPieceWithPlayer('p4', 'ÍÑIGUEZ ÑANDÚ', '11', 530, 720, 520, 710),
  ];

  const nestingResult: NestingResult = {
    placedPieces: piecesWithSpecialChars,
    totalRollLengthMm: 1450.0,
    printableWidthMm: 1120.0,
    totalPiecesAreaMm2: 520 * 710 * 4 * 0.8,
    usedRollAreaMm2: 1120 * 1450,
    utilizationPercent: 72.5,
    wastePercent: 27.5,
    executionTimeMs: 15,
    groupingMode: 'MAX_SAVINGS',
  };

  const payload = {
    placedPieces: piecesWithSpecialChars,
    nestingResult,
    projectName: 'UNIFORMES_CARACTERES_ESPECIALES',
  };

  afterEach(() => {
    delete (globalThis as any).electronEps;
  });

  it('1. El SVG maestro genera correctamente las piezas, dimensiones 1:1 y caracteres acentuados/ñ', () => {
    const svg = generateFullRollSvg(piecesWithSpecialChars, 1120.0, 1450.0);

    expect(svg).toContain('width="1120.00mm"');
    expect(svg).toContain('height="1450.00mm"');
    expect(svg).toContain('viewBox="0 0 1120.00 1450.00"');

    // Comprobar que los nombres con caracteres especiales se conservan en el SVG maestro
    expect(svg).toContain('MUÑOZ');
    expect(svg).toContain('ÁNGEL');
    expect(svg).toContain('JOSÉ PEÑA');
    expect(svg).toContain('ÍÑIGUEZ ÑANDÚ');
  });

  it('2. En entorno con puente Electron activo, exportProductionRoll utiliza el motor Inkscape', async () => {
    let capturedSvg = '';

    (globalThis as any).electronEps = {
      checkInkscape: async () => ({
        available: true,
        version: 'Inkscape 1.3',
        executablePath: 'C:\\Program Files\\Inkscape\\bin\\inkscape.exe',
      }),
      convertSvgToEps: async (params: any) => {
        capturedSvg = params.svgContent;
        const wPt = mmToPt(params.expectedDimensions.widthMm).toFixed(4);
        const hPt = mmToPt(params.expectedDimensions.heightMm).toFixed(4);
        return {
          success: true,
          epsContent: `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 ${Math.ceil(Number(wPt))} ${Math.ceil(Number(hPt))}\n%%HiResBoundingBox: 0.0000 0.0000 ${wPt} ${hPt}\n%%LanguageLevel: 3\n%%EOF\n`,
          warnings: [],
          executionTimeMs: 120,
        };
      },
    };

    const res = await exportProductionRoll(payload, {
      format: 'EPS',
      fileName: 'PRODUCCION_EPS_TEST',
      ripProfile: 'MIMAKI_RASTERLINK',
      includeCutContour: false,
      cutContourColor: '#ff0000',
      cutContourWidthMm: 0.25,
      includeSeamLabels: false,
      paperRollWidthMm: 1120.0,
      totalRollLengthMm: 1450.0,
    });

    expect(res.fileName).toBe('PRODUCCION_EPS_TEST.eps');
    expect(res.mimeType).toBe('application/postscript');
    expect(res.fileSizeBytes).toBeGreaterThan(50);
    expect(capturedSvg).toContain('MUÑOZ');
    expect(capturedSvg).toContain('ÁNGEL');
    expect(capturedSvg).toContain('width="1120.00mm"');
  });

  it('3. En entorno sin Electron, exportProductionRoll provee fallback seguro sin romper la ejecución', async () => {
    const res = await exportProductionRoll(payload, {
      format: 'EPS',
      fileName: 'PRODUCCION_FALLBACK',
      ripProfile: 'MIMAKI_RASTERLINK',
      includeCutContour: false,
      cutContourColor: '#ff0000',
      cutContourWidthMm: 0.25,
      includeSeamLabels: false,
      paperRollWidthMm: 1120.0,
      totalRollLengthMm: 1450.0,
    });

    expect(res.fileName).toBe('PRODUCCION_FALLBACK.eps');
    expect(res.mimeType).toBe('application/postscript');
    expect(res.fileSizeBytes).toBeGreaterThan(0);
  });
});
