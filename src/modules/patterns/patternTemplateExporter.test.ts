import { describe, it, expect } from 'vitest';
import { generateIllustratorTemplateSvg } from './patternTemplateExporter';
import { PatternSet } from './types';

describe('patternTemplateExporter', () => {
  const mockPatternSet: PatternSet = {
    id: 'pat-1',
    name: 'Camiseta Fútbol 2026',
    garmentType: 'FUTBOL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sizes: [
      {
        id: 'sz-1',
        sizeName: 'M',
        sortOrder: 1,
        pieces: [
          {
            id: 'p-1',
            sizeName: 'M',
            pieceName: 'DELANTERO',
            pieceType: 'DELANTERO',
            cutPolygon: [
              { x: 0, y: 0 },
              { x: 400, y: 0 },
              { x: 400, y: 600 },
              { x: 0, y: 600 },
            ],
            seamPolygon: [
              { x: 10, y: 10 },
              { x: 390, y: 10 },
              { x: 390, y: 590 },
              { x: 10, y: 590 },
            ],
            bbox: { minX: 0, minY: 0, maxX: 400, maxY: 600, width: 400, height: 600 },
            allowedRotationsDeg: [0],
            areaMm2: 240000,
            svgPathData: 'M0,0 L400,0 L400,600 L0,600 Z',
            originalElementId: 'elem_1',
            placeholders: [],
            isAssigned: true,
          },
        ],
      },
    ],
    unassignedPieces: [],
  };

  it('genera un SVG estructurado con capas de corte, costura y guías para Illustrator', () => {
    const svg = generateIllustratorTemplateSvg(mockPatternSet);
    expect(svg).toContain('<svg');
    expect(svg).toContain('id="LÍNEA_DE_CORTE"');
    expect(svg).toContain('id="LÍNEA_DE_COSTURA"');
    expect(svg).toContain('id="GUÍAS_Y_MEDIDAS"');
    expect(svg).toContain('id="TEXTOS_Y_REFERENCIAS"');
    expect(svg).toContain('TALLA M');
    expect(svg).toContain('40.0 cm × 60.0 cm');
  });
});
