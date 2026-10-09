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
});
