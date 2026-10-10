const CACHE_LIMIT = 24;
const MAX_CACHEABLE_SVG_LENGTH = 32768;
const namespaceCache = new Map<string, string>();

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cacheResult(key: string, value: string): string {
  if (namespaceCache.size >= CACHE_LIMIT) {
    const oldestKey = namespaceCache.keys().next().value;
    if (oldestKey !== undefined) namespaceCache.delete(oldestKey);
  }
  namespaceCache.set(key, value);
  return value;
}

/**
 * Aisla IDs y clases de un SVG embebido sin confundir referencias con colores
 * hexadecimales. El resultado es determinista y se conserva en una cache acotada.
 */
export function namespaceSvgIds(svgContent: string, namespace: string): string {
  if (!svgContent) return svgContent;

  const safeNamespace = namespace.replace(/[^a-zA-Z0-9_-]/g, '_') || 'svg';
  const canCache = svgContent.length <= MAX_CACHEABLE_SVG_LENGTH;
  const cacheKey = canCache ? `${safeNamespace}\u0000${svgContent}` : '';
  if (canCache) {
    const cached = namespaceCache.get(cacheKey);
    if (cached !== undefined) return cached;
  }

  const ids = new Set<string>();
  const idPattern = /\bid\s*=\s*(["'])([^"']+)\1/gi;
  let match: RegExpExecArray | null;
  while ((match = idPattern.exec(svgContent)) !== null) ids.add(match[2]);

  let result = svgContent.replace(idPattern, (_full, quote: string, id: string) =>
    `id=${quote}${safeNamespace}__${id}${quote}`
  );

  for (const id of Array.from(ids).sort((a, b) => b.length - a.length)) {
    const escapedId = escapeRegExp(id);
    const replacement = `${safeNamespace}__${id}`;

    // Referencias de pintura, recorte, filtros y marcadores.
    result = result.replace(
      new RegExp(`url\\(\\s*(["']?)#${escapedId}\\1\\s*\\)`, 'g'),
      (_full, quote: string) => `url(${quote}#${replacement}${quote})`,
    );
    // <use>, <image> y enlaces SVG 1.1/2.
    result = result.replace(
      new RegExp(`((?:href|xlink:href)\\s*=\\s*["'])#${escapedId}(["'])`, 'gi'),
      `$1#${replacement}$2`,
    );
    // Referencias temporales SMIL: begin="shape.click".
    result = result.replace(
      new RegExp(`((?:begin|end)\\s*=\\s*["'][^"']*)\\b${escapedId}(?=\\.)`, 'gi'),
      `$1${replacement}`,
    );
  }

  const classNames = new Set<string>();
  const classPattern = /\bclass\s*=\s*(["'])([^"']+)\1/gi;
  while ((match = classPattern.exec(svgContent)) !== null) {
    match[2].split(/\s+/).filter(Boolean).forEach((name) => classNames.add(name));
  }

  // Limitar el reemplazo de selectores al contenido de <style>; así no se
  // alteran números decimales, texto ni atributos ajenos.
  result = result.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_all, open, css, close) => {
    let scopedCss = css;
    for (const className of Array.from(classNames).sort((a, b) => b.length - a.length)) {
      scopedCss = scopedCss.replace(
        new RegExp(`\\.${escapeRegExp(className)}(?![\\w-])`, 'g'),
        `.${safeNamespace}__${className}`,
      );
    }
    for (const id of Array.from(ids).sort((a, b) => b.length - a.length)) {
      scopedCss = scopedCss.replace(
        new RegExp(`#${escapeRegExp(id)}(?![\\w-])`, 'g'),
        `#${safeNamespace}__${id}`,
      );
    }
    return `${open}${scopedCss}${close}`;
  });

  result = result.replace(classPattern, (_full, quote: string, classes: string) => {
    const namespacedClasses = classes
      .split(/\s+/)
      .filter(Boolean)
      .map((className) => `${safeNamespace}__${className}`)
      .join(' ');
    return `class=${quote}${namespacedClasses}${quote}`;
  });

  return canCache ? cacheResult(cacheKey, result) : result;
}
