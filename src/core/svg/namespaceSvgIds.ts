const CACHE_LIMIT = 16;
const MAX_CACHEABLE_SVG_LENGTH = 5_000_000;
const namespaceCache = new Map<string, string>();

function getCachedNamespaceResult(key: string): string | undefined {
  const cached = namespaceCache.get(key);
  if (cached !== undefined) {
    namespaceCache.delete(key);
    namespaceCache.set(key, cached);
  }
  return cached;
}

function cacheResult(key: string, value: string): string {
  if (namespaceCache.has(key)) {
    namespaceCache.delete(key);
  } else if (namespaceCache.size >= CACHE_LIMIT) {
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
    const cached = getCachedNamespaceResult(cacheKey);
    if (cached !== undefined) return cached;
  }

  // Paso 1: Recolectar y renombrar atributos id="..." en 1 sola pasada O(N)
  const ids = new Set<string>();
  let result = svgContent.replace(
    /\bid\s*=\s*(["'])([^"']+)\1/gi,
    (_full, quote: string, idValue: string) => {
      ids.add(idValue);
      return `id=${quote}${safeNamespace}__${idValue}${quote}`;
    }
  );

  // Paso 2: Recolectar clases de <style> y renombrar selectores #id y .class
  // únicamente en la parte de los selectores CSS (antes de '{') en 1 sola pasada por bloque <style>
  const classNames = new Set<string>();
  if (result.includes('<style') || result.includes('<STYLE')) {
    result = result.replace(
      /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
      (_all, open: string, css: string, close: string) => {
        const scopedCss = css.replace(
          /([^{}]+)\{([^{}]*)\}/g,
          (_rule, selectors: string, declarations: string) => {
            let scopedSelectors = selectors.replace(
              /\.([a-zA-Z_-][a-zA-Z0-9_-]*)\b/g,
              (_m, cls: string) => {
                classNames.add(cls);
                return `.${safeNamespace}__${cls}`;
              }
            );
            if (ids.size > 0) {
              scopedSelectors = scopedSelectors.replace(
                /#([a-zA-Z0-9_-]+)\b/g,
                (match, refId: string) =>
                  ids.has(refId) ? `#${safeNamespace}__${refId}` : match
              );
            }
            return `${scopedSelectors}{${declarations}}`;
          }
        );
        return `${open}${scopedCss}${close}`;
      }
    );
  }

  // Paso 3: Reemplazar referencias url(#id), href="#id", xlink:href="#id" y SMIL begin/end en 1 sola pasada cada una
  if (ids.size > 0) {
    result = result.replace(
      /url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g,
      (m, q: string, id: string) =>
        ids.has(id) ? `url(${q}#${safeNamespace}__${id}${q})` : m
    );
    result = result.replace(
      /((?:xlink:href|href)\s*=\s*)(["'])#([^"']+)\2/gi,
      (m, attr: string, q: string, id: string) =>
        ids.has(id) ? `${attr}${q}#${safeNamespace}__${id}${q}` : m
    );
    result = result.replace(
      /(\b(?:begin|end)\s*=\s*)(["'])([^"'.;\s]+)(\.[^"']*\2)/gi,
      (m, attr: string, q: string, id: string, rest: string) =>
        ids.has(id) ? `${attr}${q}${safeNamespace}__${id}${rest}` : m
    );
  }

  // Paso 4: Reemplazar atributos class="..." en 1 sola pasada si existen clases en <style>
  if (classNames.size > 0) {
    result = result.replace(
      /(\bclass\s*=\s*)(["'])([^"']+)\2/gi,
      (_m, attr: string, q: string, val: string) => {
        const updated = val
          .trim()
          .split(/\s+/)
          .map((t) => (classNames.has(t) ? `${safeNamespace}__${t}` : t))
          .join(' ');
        return `${attr}${q}${updated}${q}`;
      }
    );
  }

  return canCache ? cacheResult(cacheKey, result) : result;
}
