import { describe, expect, it } from 'vitest';
import { PlacedNestingPiece } from '@/core/nesting/types';
import {
  generateFullRollSvg,
  getSvgPlacementTransform,
  namespaceSvgFragment,
  stripLegacyTechnicalContour,
  stripLegacyWorkshopLabel,
} from './svgExporter';

function makePiece(
  id: string,
  xMm: number,
  yMm: number,
  svgContent?: string,
  rotationDeg = 0
): PlacedNestingPiece {
  const width = 100;
  const height = 50;
  return {
    id,
    orderItemId: `order_${id}`,
    pieceId: `pattern_${id}`,
    playerName: 'ÍÑIGO & PEÑA',
    playerNumber: '8',
    sizeName: 'M',
    pieceType: 'ESPALDA',
    bbox: { width, height },
    areaMm2: width * height,
    allowedRotations: [0, 90, 180, 270],
    cutPolygon: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    svgContent,
    xMm,
    yMm,
    rotationDeg,
    effectiveWidthMm: rotationDeg === 90 || rotationDeg === 270 ? height : width,
    effectiveHeightMm: rotationDeg === 90 || rotationDeg === 270 ? width : height,
    isLocked: false,
  };
}

describe('SVG production exporter', () => {
  it('emite escala física 1:1 sin fondo, etiquetas ni líneas técnicas por defecto', () => {
    const piece = makePiece(
      'one',
      10,
      20,
      '<rect width="100" height="50" fill="#facc15" />'
    );
    const svg = generateFullRollSvg([piece], 1120, 4250);

    expect(svg).toContain('width="1120.00mm"');
    expect(svg).toContain('height="4250.00mm"');
    expect(svg).toContain('viewBox="0 0 1120.00 4250.00"');
    expect(svg).not.toContain('data-hmb-role="technical-cut-contour"');
    expect(svg).not.toContain('data-hmb-role="workshop-label"');
    expect(svg).not.toContain('stroke="#ff0000"');
    expect(svg).not.toContain('stroke="#22c55e"');
    expect(svg).not.toContain('Fondo de referencia');
    expect(svg).toContain('data-player="ÍÑIGO &amp; PEÑA"');
  });

  it('solo agrega el contorno técnico cuando el llamador lo solicita explícitamente', () => {
    const svg = generateFullRollSvg([makePiece('one', 0, 0)], 1120, 100, {
      includeCutContour: true,
      cutContourColor: '#ff00ff',
      cutContourWidthMm: 0.25,
    });

    expect(svg.match(/data-hmb-role="technical-cut-contour"/g)).toHaveLength(1);
    expect(svg).toContain('stroke="#ff00ff"');
    expect(svg).toContain('stroke-width="0.25"');
  });

  it('retira únicamente el antiguo contorno verde generado por HMB', () => {
    const fragment = `
      <!-- Contorno de corte visible 1:1 -->
      <path d="M0 0L10 0Z" fill="none" stroke="#22c55e" stroke-width="1.0" opacity="0.6" />
      <path d="M0 1L10 1Z" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.6" />
      <path d="M0 2L10 2Z" fill="none" stroke="#22c55e" stroke-width="1" opacity="0.9" />
    `;

    const clean = stripLegacyTechnicalContour(fragment);
    expect(clean).not.toContain('M0 0L10 0Z');
    expect(clean).toContain('M0 1L10 1Z');
    expect(clean).toContain('M0 2L10 2Z');
  });

  it('retira la etiqueta de confección heredada sin borrar dorsales', () => {
    const fragment = `
      <!-- Etiqueta de confección -->
      <text x="50" y="56" font-family="monospace" font-size="5" fill="#94a3b8" text-anchor="middle" font-weight="bold">MATEO | #10 | TM | ESPALDA</text>
      <text x="50" y="25" font-family="Bebas Neue" font-size="20" fill="#ffffff" text-anchor="middle" font-weight="bold">10</text>
    `;

    const clean = stripLegacyWorkshopLabel(fragment);
    expect(clean).not.toContain('MATEO | #10');
    expect(clean).toContain('>10</text>');
  });

  it('crea IDs y clases locales por pieza y conserva todas sus referencias', () => {
    const repeatedArtwork = `
      <?xml version="1.0"?>
      <svg viewBox="0 0 100 50">
        <defs>
          <linearGradient id="paint"><stop offset="0" stop-color="#fff" /></linearGradient>
          <clipPath id="cut"><path id="shape" d="M0 0H100V50H0Z" /></clipPath>
          <style>.cls-1{fill:url(#paint)} #layer{clip-path:url('#cut')}</style>
        </defs>
        <g id="layer" class="cls-1"><use href="#shape" /></g>
      </svg>
    `;
    const svg = generateFullRollSvg([
      makePiece('one', 0, 0, repeatedArtwork),
      makePiece('two', 120, 0, repeatedArtwork),
    ], 1120, 100);

    expect(svg).not.toContain('id="paint"');
    expect(svg).not.toContain('id="cut"');
    expect(svg).not.toContain('id="shape"');
    expect(svg).not.toContain('id="layer"');
    expect(svg).not.toContain('class="cls-1"');
    expect(svg).not.toContain('href="#shape"');

    const ids = Array.from(svg.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);

    const references = [
      ...Array.from(svg.matchAll(/url\(#([^\s)]+)\)/g), (match) => match[1]),
      ...Array.from(svg.matchAll(/\bhref="#([^"]+)"/g), (match) => match[1]),
    ];
    const idSet = new Set(ids);
    for (const reference of references) {
      expect(idSet.has(reference)).toBe(true);
    }
  });

  it('preserva imágenes raster incrustadas sin confundirlas con recursos de otra pieza', () => {
    const image = '<svg><image id="image" width="10" height="10" href="data:image/png;base64,AAAA" /></svg>';
    const first = namespaceSvgFragment(image, 'piece_1');
    const second = namespaceSvgFragment(image, 'piece_2');

    expect(first).toContain('id="piece_1_id_1_image"');
    expect(second).toContain('id="piece_2_id_1_image"');
    expect(first).toContain('href="data:image/png;base64,AAAA"');
    expect(second).toContain('href="data:image/png;base64,AAAA"');

    const roll = generateFullRollSvg([
      makePiece('one', 0, 0, image),
      makePiece('two', 120, 0, image),
    ], 1120, 100);
    expect(roll.match(/data:image\/png;base64,AAAA/g)).toHaveLength(1);
    expect(roll).toContain('id="hmb_embedded_image_1"');
    expect(roll.match(/ href="#hmb_embedded_image_1"/g)).toHaveLength(2);
    expect(roll).toContain('id="hmb_piece_1_id_1_image"');
    expect(roll).toContain('id="hmb_piece_2_id_1_image"');
  });

  it('normaliza 90° y 180° al mismo origen superior izquierdo usado por nesting', () => {
    expect(getSvgPlacementTransform(makePiece('p90', 10, 20, undefined, 90)))
      .toBe('translate(60 20) rotate(90)');
    expect(getSvgPlacementTransform(makePiece('p180', 10, 20, undefined, 180)))
      .toBe('translate(110 70) rotate(180)');
    expect(getSvgPlacementTransform(makePiece('p270', 10, 20, undefined, 270)))
      .toBe('translate(10 120) rotate(270)');
  });

  it('rechaza dimensiones físicas inválidas en vez de producir un SVG corrupto', () => {
    expect(() => generateFullRollSvg([], Number.NaN, 100)).toThrow(/ancho del rollo/i);
    expect(() => generateFullRollSvg([], 1120, 0)).toThrow(/largo del rollo/i);
  });
});
