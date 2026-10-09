import * as opentype from 'opentype.js';
import { DynamicPlaceholderRule } from '@/modules/designs/types';

const fontCache = new Map<string, opentype.Font>();
const loadingPromises = new Map<string, Promise<opentype.Font | null>>();

const FONT_FILE_MAP: Record<string, string> = {
  'bebas neue': '/fonts/bebas_neue.ttf',
  'anton': '/fonts/anton.ttf',
  'teko': '/fonts/teko.ttf',
  'oswald': '/fonts/oswald.ttf',
  'montserrat': '/fonts/montserrat.ttf',
  'russo one': '/fonts/russo_one.ttf',
  'squada one': '/fonts/squada_one.ttf',
  'righteous': '/fonts/righteous.ttf',
  'barlow condensed': '/fonts/barlow_condensed.ttf',
  'chakra petch': '/fonts/chakra_petch.ttf',
  'kanit': '/fonts/kanit.ttf',
  'black han sans': '/fonts/black_han_sans.ttf',
  'fjalla one': '/fonts/fjalla_one.ttf',
  'saira condensed': '/fonts/saira_condensed.ttf',
  'staatliches': '/fonts/staatliches.ttf',
  'audiowide': '/fonts/audiowide.ttf',
};

function normalizeFontName(family?: string): string {
  return (family || 'Bebas Neue')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Registra una instancia opentype.Font directamente en memoria
 */
export function registerOpentypeFont(name: string, font: opentype.Font): void {
  const aliases = new Set<string>([name]);
  const names = font.names as unknown as Record<string, Record<string, string> | undefined>;
  for (const key of ['fontFamily', 'fullName', 'postScriptName', 'preferredFamily']) {
    const localized = names?.[key];
    if (!localized) continue;
    for (const value of Object.values(localized)) {
      if (typeof value === 'string' && value.trim()) aliases.add(value);
    }
  }
  aliases.forEach((alias) => fontCache.set(normalizeFontName(alias), font));
}

async function loadInstalledBrowserFont(family: string): Promise<opentype.Font | null> {
  if (typeof window === 'undefined' || !('queryLocalFonts' in window)) return null;

  try {
    const requested = normalizeFontName(family);
    const localFonts = await (window as any).queryLocalFonts();
    const match = localFonts.find((entry: any) =>
      [entry.family, entry.fullName, entry.postscriptName]
        .filter(Boolean)
        .some((name: string) => normalizeFontName(name) === requested)
    );
    if (!match || typeof match.blob !== 'function') return null;

    const blob = await match.blob();
    const buffer = await blob.arrayBuffer();
    const font = opentype.parse(buffer);
    registerOpentypeFont(family, font);
    return font;
  } catch (err) {
    console.warn(`No se pudo leer la fuente local "${family}" para convertirla a curvas:`, err);
    return null;
  }
}

export function getOpentypeFont(family?: string): opentype.Font | null {
  const norm = normalizeFontName(family);
  if (fontCache.has(norm)) {
    return fontCache.get(norm)!;
  }

  // En entorno Node / Vitest, cargar sincrónicamente el archivo si existe en public/fonts
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = require('node:fs');
      const p = require('node:path');
      const relPath = FONT_FILE_MAP[norm] || `/fonts/${norm.replace(/\s+/g, '_')}.ttf`;
      const localPath = p.join(process.cwd(), 'public', relPath.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        const buf = fs.readFileSync(localPath);
        const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
        registerOpentypeFont(family || norm, font);
        return font;
      }
    } catch (_) {
      // Ignorar error
    }
  }

  return null;
}

/**
 * Carga asíncronamente una fuente TTF/OTF desde el servidor local o URL
 */
export async function loadOpentypeFont(family: string): Promise<opentype.Font | null> {
  const norm = normalizeFontName(family);
  if (fontCache.has(norm)) {
    return fontCache.get(norm)!;
  }

  if (loadingPromises.has(norm)) {
    return loadingPromises.get(norm)!;
  }

  const promise = (async () => {
    try {
      const path = FONT_FILE_MAP[norm] || `/fonts/${norm.replace(/\s+/g, '_')}.ttf`;
      
      let buffer: ArrayBuffer | null = null;
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const res = await fetch(path);
        if (res.ok) {
          buffer = await res.arrayBuffer();
        }
      } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // En entorno Node / Vitest
        try {
          const fs = await import('node:fs');
          const p = await import('node:path');
          const localPath = p.join(process.cwd(), 'public', path.replace(/^\//, ''));
          if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath);
            buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
          }
        } catch {
          // Ignorar error en Node
        }
      }

      if (buffer) {
        const font = opentype.parse(buffer);
        registerOpentypeFont(family, font);
        return font;
      }

      // Para fuentes instaladas (AdiCup, Jersey M54, etc.), obtener el binario
      // mediante Local Font Access y no depender de sustitución en Illustrator.
      const installedFont = await loadInstalledBrowserFont(family);
      if (installedFont) return installedFont;
    } catch (err) {
      console.warn(`No se pudo cargar la fuente opentype "${family}":`, err);
    }
    return null;
  })();

  loadingPromises.set(norm, promise);
  // Un fallo suele significar que Local Font Access aún no tenía permiso.
  // No conservar resultados negativos: después de "Sincronizar PC / TTF"
  // debe poder intentarse nuevamente y leer el archivo real.
  void promise.finally(() => {
    loadingPromises.delete(norm);
  });
  return promise;
}

/** Indica si la familia exacta ya está disponible para convertir a curvas. */
export function isOpentypeFontReady(family?: string): boolean {
  return fontCache.has(normalizeFontName(family));
}

/**
 * Pre-carga las fuentes deportivas estándar en segundo plano
 */
export async function preloadStandardFonts(): Promise<void> {
  const standard = ['bebas neue', 'anton', 'teko', 'oswald', 'montserrat', 'russo one'];
  await Promise.allSettled(standard.map((f) => loadOpentypeFont(f)));
}

/**
 * Inicializar precarga de fuentes en entorno navegador
 */
if (typeof window !== 'undefined') {
  preloadStandardFonts();
}

function formatSvgNumber(value: number, decimals = 3): string {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function pathToSvgData(path: opentype.Path, decimals = 3): string {
  let d = '';
  for (const cmd of path.commands) {
    if (cmd.type === 'M') {
      d += `M${formatSvgNumber(cmd.x, decimals)} ${formatSvgNumber(cmd.y, decimals)}`;
    } else if (cmd.type === 'L') {
      d += `L${formatSvgNumber(cmd.x, decimals)} ${formatSvgNumber(cmd.y, decimals)}`;
    } else if (cmd.type === 'C') {
      d += `C${formatSvgNumber(cmd.x1, decimals)} ${formatSvgNumber(cmd.y1, decimals)} ${formatSvgNumber(cmd.x2, decimals)} ${formatSvgNumber(cmd.y2, decimals)} ${formatSvgNumber(cmd.x, decimals)} ${formatSvgNumber(cmd.y, decimals)}`;
    } else if (cmd.type === 'Q') {
      d += `Q${formatSvgNumber(cmd.x1, decimals)} ${formatSvgNumber(cmd.y1, decimals)} ${formatSvgNumber(cmd.x, decimals)} ${formatSvgNumber(cmd.y, decimals)}`;
    } else if (cmd.type === 'Z') {
      d += 'Z';
    }
  }
  return d;
}

/**
 * Convierte texto deportivo a curvas vectoriales nativas (<path d="..." />)
 * garantizando visualización idéntica e inmutable en Illustrator, Corel, RIPs, etc.
 */
export function convertTextToVectorPath(
  text: string,
  rule: DynamicPlaceholderRule,
  fontSizeMm: number,
  visualWidthMm: number,
  customScaleY: number
): string | null {
  const font = getOpentypeFont(rule.fontFamily);
  if (!font) {
    return null; // Fallback a <text> si la fuente aún no está cargada
  }

  const safeText = text.trim().toUpperCase();
  if (!safeText) return '';

  const rawPath = font.getPath(safeText, 0, 0, fontSizeMm);
  const bbox = rawPath.getBoundingBox();
  const glyphWidth = bbox.x2 - bbox.x1;
  const naturalWidth = font.getAdvanceWidth(safeText, fontSizeMm) || glyphWidth;

  if (naturalWidth <= 0) return null;

  const scaleX = visualWidthMm / naturalWidth;
  const yCenter = (bbox.y1 + bbox.y2) / 2;

  const anchorX = Number.isFinite(rule.anchorX) ? rule.anchorX : 0;
  const anchorY = Number.isFinite(rule.anchorY) ? rule.anchorY : 0;

  let transX = anchorX - (visualWidthMm / 2);
  if (rule.textAlign === 'left') transX = anchorX;
  if (rule.textAlign === 'right') transX = anchorX - visualWidthMm;

  const transY = anchorY - (yCenter * customScaleY);

  const pathData = pathToSvgData(rawPath, 3);
  const fillColor = escapeXmlAttribute(rule.fillColor || '#ffffff');

  let strokeAttrs = '';
  if (rule.strokeColor && rule.strokeWidthMm && rule.strokeWidthMm > 0) {
    strokeAttrs = `stroke="${escapeXmlAttribute(rule.strokeColor)}" stroke-width="${formatSvgNumber(rule.strokeWidthMm)}" stroke-linejoin="round" stroke-miterlimit="4" paint-order="stroke fill"`;
  }

  return `
    <g transform="translate(${formatSvgNumber(transX)} ${formatSvgNumber(transY)}) scale(${formatSvgNumber(scaleX)} ${formatSvgNumber(customScaleY)})">
      <path
        d="${pathData}"
        fill="${fillColor}"
        ${strokeAttrs}
      />
    </g>
  `.trim();
}
