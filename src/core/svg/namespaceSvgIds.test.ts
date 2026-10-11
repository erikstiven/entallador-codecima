import { describe, expect, it } from 'vitest';
import { namespaceSvgIds } from './namespaceSvgIds';

describe('namespaceSvgIds', () => {
  it('aísla IDs y referencias internas exportadas por Illustrator', () => {
    const source = '<svg><defs><style>.cls-1{fill:red}.cls-2,.cls-1{opacity:.5}</style><clipPath id="clip0"/><linearGradient id="paint0"/></defs><g class="cls-1 cls-2" clip-path="url(#clip0)" fill="url(#paint0)"><use href="#clip0"/></g></svg>';
    const result = namespaceSvgIds(source, 'frente');

    expect(result).toContain('id="frente__clip0"');
    expect(result).toContain('id="frente__paint0"');
    expect(result).toContain('url(#frente__clip0)');
    expect(result).toContain('url(#frente__paint0)');
    expect(result).toContain('href="#frente__clip0"');
    expect(result).toContain('.frente__cls-1{fill:red}');
    expect(result).toContain('.frente__cls-2,.frente__cls-1{opacity:.5}');
    expect(result).toContain('class="frente__cls-1 frente__cls-2"');
  });

  it('no confunde un ID con un color hexadecimal del mismo nombre', () => {
    const source = '<svg><defs><linearGradient id="fff"/></defs><path fill="#fff" filter="url(#fff)"/></svg>';
    const result = namespaceSvgIds(source, 'pieza');

    expect(result).toContain('id="pieza__fff"');
    expect(result).toContain('fill="#fff"');
    expect(result).toContain('filter="url(#pieza__fff)"');
  });

  it('aísla selectores de ID y clase únicamente dentro de estilos', () => {
    const source = '<svg><style>#cut,.cls-1{opacity:.5}</style><path id="cut" class="cls-1" d="M.1.2"/></svg>';
    const result = namespaceSvgIds(source, 'manga');

    expect(result).toContain('#manga__cut,.manga__cls-1');
    expect(result).toContain('d="M.1.2"');
  });

  it('preserva intactos los colores hexadecimales dentro de <style> al renombrar selectores #id y .cls-1', () => {
    const source = [
      '<svg>',
      '<defs>',
      '<style>',
      '#escudo_base, .cls-1 { fill:#ff00aa; stroke:#123456; stop-color:#abcdef; }',
      '.cls-2 { fill: #fff; stroke: #000000; }',
      '</style>',
      '</defs>',
      '<g id="escudo_base" class="cls-1"><path class="cls-2" d="M0,0 L10,10"/></g>',
      '</svg>',
    ].join('');

    const result = namespaceSvgIds(source, 'delantero');

    expect(result).toContain('#delantero__escudo_base');
    expect(result).toContain('.delantero__cls-1');
    expect(result).toContain('.delantero__cls-2');
    expect(result).toContain('fill:#ff00aa;');
    expect(result).toContain('stroke:#123456;');
    expect(result).toContain('stop-color:#abcdef;');
    expect(result).toContain('fill: #fff;');
    expect(result).toContain('stroke: #000000;');
  });

  it('maneja múltiples clases en un mismo atributo class="cls-1 cls-2 external-class"', () => {
    const source = '<svg><style>.cls-1{fill:#112233}.cls-2{stroke:#445566}</style><path class="cls-1 cls-2 external-class" d="M0 0h10v10z"/></svg>';
    const result = namespaceSvgIds(source, 'short_izq');

    expect(result).toContain('.short_izq__cls-1{fill:#112233}');
    expect(result).toContain('.short_izq__cls-2{stroke:#445566}');
    expect(result).toContain('class="short_izq__cls-1 short_izq__cls-2');
  });

  it('actualiza todas las variantes de referencias url(#...), url(\'#...\'), url("#..."), href y xlink:href', () => {
    const source = [
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink">',
      '<defs>',
      '<linearGradient id="grad1"/>',
      '<path id="path1" d="M0,0 L50,50"/>',
      '<clipPath id="clip1"><use xlink:href="#path1"/></clipPath>',
      '</defs>',
      '<rect fill="url(#grad1)" stroke="url(\'#grad1\')" filter=\'url("#grad1")\' clip-path="url(#clip1)"/>',
      '<use href="#path1" xlink:href="#clip1"/>',
      '</svg>',
    ].join('');

    const result = namespaceSvgIds(source, 'espalda');

    expect(result).toContain('id="espalda__grad1"');
    expect(result).toContain('id="espalda__path1"');
    expect(result).toContain('id="espalda__clip1"');
    expect(result).toContain('fill="url(#espalda__grad1)"');
    expect(result).toContain('stroke="url(\'#espalda__grad1\')"');
    expect(result).toContain('filter=\'url("#espalda__grad1")\'');
    expect(result).toContain('clip-path="url(#espalda__clip1)"');
    expect(result).toContain('href="#espalda__path1"');
    expect(result).toContain('xlink:href="#espalda__clip1"');
  });

  it('benchmark: procesa un SVG pesado de Illustrator (1,000 IDs + url(#grad_i) y 300 clases .cls-i) en menos de 100 ms', () => {
    const cssRules: string[] = [];
    for (let c = 0; c < 300; c++) {
      cssRules.push(`.cls-${c}{fill:#ff00aa;stroke:#123456;stroke-width:${(c % 5) + 1}px}`);
    }

    const defsElements: string[] = [];
    const bodyElements: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const clsA = `cls-${i % 300}`;
      const clsB = `cls-${(i + 1) % 300}`;
      defsElements.push(
        `<linearGradient id="grad_${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff00aa"/><stop offset="100%" stop-color="#123456"/></linearGradient>`
      );
      bodyElements.push(
        `<path class="${clsA} ${clsB}" fill="url(#grad_${i})" d="M ${i} 0 L ${i + 10} 20 L ${i} 40 Z"/>`
      );
    }

    const heavySvg = `<svg viewBox="0 0 1000 1000"><defs><style>${cssRules.join('')}</style>${defsElements.join('')}</defs><g>${bodyElements.join('')}</g></svg>`;

    const start = performance.now();
    const result = namespaceSvgIds(heavySvg, 'bench_talla_m');
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThan(100);
    expect(result).toContain('id="bench_talla_m__grad_0"');
    expect(result).toContain('id="bench_talla_m__grad_999"');
    expect(result).toContain('url(#bench_talla_m__grad_0)');
    expect(result).toContain('url(#bench_talla_m__grad_999)');
    expect(result).toContain('.bench_talla_m__cls-0{fill:#ff00aa;stroke:#123456;');
    expect(result).toContain('.bench_talla_m__cls-299{fill:#ff00aa;stroke:#123456;');
    expect(result).toContain('class="bench_talla_m__cls-0 bench_talla_m__cls-1"');
  });
});
