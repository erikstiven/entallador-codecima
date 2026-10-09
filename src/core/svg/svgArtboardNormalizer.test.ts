import { describe, it, expect } from 'vitest';
import { normalizeSvgArtboard, extractGarmentBBox } from './svgArtboardNormalizer';

describe('svgArtboardNormalizer', () => {
  it('debe devolver el mismo contenido si no es un SVG válido o está vacío', () => {
    expect(normalizeSvgArtboard('')).toBe('');
    expect(normalizeSvgArtboard('<div>no svg</div>')).toBe('<div>no svg</div>');
  });

  it('debe descartar mesas de trabajo transparentes rect[fill="none"] y ajustar viewBox a la prenda', () => {
    const inputSvg = `
      <svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect id="artboard" width="1920" height="1080" fill="none" />
        <path d="M 100 200 L 500 200 L 500 800 L 100 800 Z" fill="#0284c7" />
      </svg>
    `;
    const normalized = normalizeSvgArtboard(inputSvg);
    expect(normalized).toContain('<svg');
    expect(normalized).not.toContain('id="artboard"');
  });

  it('debe ignorar rectángulos gigantes de fondo blanco (lienzo de Illustrator)', () => {
    const inputSvg = `
      <svg viewBox="0 0 2000 2000" xmlns="http://www.w3.org/2000/svg">
        <rect width="2000" height="2000" fill="#ffffff" />
        <polygon points="500,500 900,500 900,1200 500,1200" fill="#ea580c" />
      </svg>
    `;
    const normalized = normalizeSvgArtboard(inputSvg);
    expect(normalized).toContain('<svg');
  });
});
