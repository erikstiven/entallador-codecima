import { OrderItem } from '@/modules/orders/types';
import { PatternSet, PatternPiece, PieceType } from '@/modules/patterns/types';
import { Point2D } from '@/core/geometry/types';
import { MasterDesign, DynamicPlaceholderRule } from '@/modules/designs/types';
import { 
  GeneratedPiece, 
  GenerationConfig, 
  GenerationResult, 
  PieceLabelInfo 
} from './types';
import { computeBoundingBox, calculatePolygonArea, polygonToSvgPath } from '@/core/geometry/transform';
import { computeTextFitting, applyPlaceholdersToArtwork } from '@/core/fonts/textVectorEngine';
import { normalizeSizeName } from '@/modules/orders/orderValidator';
import { namespaceSvgIds } from '@/core/svg/namespaceSvgIds';
import { normalizeSvgArtboard } from '@/core/svg/svgArtboardNormalizer';

const DEFAULT_CONFIG: GenerationConfig = {
  includeLabels: true,
  labelDistanceMm: 6.0,
  labelFontSizeMm: 5.0,
  labelColor: '#94a3b8',
  includeSizeMark: false,
  sizeMarkColor: '#000000',
  sizeMarkFontSizeMm: 8,
  sizeMarkBottomOffsetMm: 8,
  sleeveArtOffsetYMm: 0,
  frontArtOffsetYMm: 0,
  backArtOffsetYMm: 0,
  shortArtOffsetYMm: 0,
  includeShortNumber: true,
  shortNumberPiece: 'DER',
  shortNumberXPercent: 50,
  shortNumberYPercent: 45,
  shortNumberScale: 1,
  shortNumberScaleX: 1,
  shortNumberScaleY: 1,
  includeFrontNumber: false,
  frontNumberPosition: 'CENTRO',
  frontNumberXPercent: 50,
  frontNumberYPercent: 38,
  frontNumberScale: 1,
};

/**
 * Determina qué tipos de piezas requiere un jugador según su tipo de prenda
 */
function getRequiredPieceTypes(garmentType: string): PieceType[] {
  switch (garmentType) {
    case 'CAMISETA':
      return [
        'DELANTERO',
        'DELANTERO_V',
        'DELANTERO_REDONDO',
        'ESPALDA',
        'MANGA_IZQ',
        'MANGA_DER',
        'CUELLO',
      ];
    case 'SHORT':
      return [
        'PANTALONETA_IZQ',
        'PANTALONETA_DER',
        'SHORT_FRENTE',
        'SHORT_ESPALDA',
      ];
    case 'COMPLETO':
    default:
      return [
        'DELANTERO',
        'DELANTERO_V',
        'DELANTERO_REDONDO',
        'ESPALDA',
        'MANGA_IZQ',
        'MANGA_DER',
        'CUELLO',
        'PANTALONETA_IZQ',
        'PANTALONETA_DER',
        'SHORT_FRENTE',
        'SHORT_ESPALDA',
      ];
  }
}

/**
 * Normaliza el arte vectorial para que su viewBox encuadre exactamente las formas
 * de la prenda, eliminando los márgenes de mesa de trabajo transparente de Illustrator/Corel.
 */
export function normalizeArtworkSvgForMold(svgContent: string): string {
  return normalizeSvgArtboard(svgContent, { paddingRatio: 0 });
}

export interface PieceSvgTemplate {
  templateKey: string;
  uniquePieceId: string;
  maskId: string;
  svgPathData: string;
  translateTransform: string;
  dorsalSvg: string;
  sizeMarkSvg: string;
}

/**
 * Almacenes Flyweight fuera del estado reactivo de Zustand.
 * - baseArtworkRegistry: Mantiene únicamente 1 copia del SVG de fondo por cada combinación de Molde + Talla.
 * - pieceTemplateRegistry: Mantiene los metadatos ligeros de personalización de cada jugador (nombre, número).
 * - pieceSvgRegistry: Fallback directo para piezas personalizadas independientes.
 */
export const baseArtworkRegistry = new Map<string, string>();
export const pieceTemplateRegistry = new Map<string, PieceSvgTemplate>();
const pieceSvgFallbackRegistry = new Map<string, string>();

/**
 * Registro Flyweight con interfaz Map estándar compatible con el ecosistema.
 */
export const pieceSvgRegistry = {
  get(id: string): string | undefined {
    const res = resolvePieceSvg({ id });
    return res || undefined;
  },
  has(id: string): boolean {
    return pieceTemplateRegistry.has(id) || pieceSvgFallbackRegistry.has(id);
  },
  set(id: string, content: string): void {
    pieceSvgFallbackRegistry.set(id, content);
  },
  delete(id: string): boolean {
    const a = pieceTemplateRegistry.delete(id);
    const b = pieceSvgFallbackRegistry.delete(id);
    return a || b;
  },
  clear(): void {
    pieceTemplateRegistry.clear();
    pieceSvgFallbackRegistry.clear();
    baseArtworkRegistry.clear();
  },
  get size(): number {
    return pieceTemplateRegistry.size + pieceSvgFallbackRegistry.size;
  },
};

/**
 * Obtiene el contenido SVG de una pieza desde el registro Flyweight.
 */
export function getPieceSvgContent(pieceId: string): string {
  return resolvePieceSvg({ id: pieceId });
}

/**
 * Registra o actualiza el contenido SVG de una pieza en el almacén Flyweight.
 */
export function setPieceSvgContent(pieceId: string, svgContent: string): void {
  pieceSvgFallbackRegistry.set(pieceId, svgContent);
}

/**
 * Resuelve el SVG completo de una pieza bajo demanda:
 * 1. Si trae svgContent con contenido, lo usa directamente.
 * 2. Si existe en pieceTemplateRegistry, combina la plantilla base de la talla con el dorsal (Cero duplicación de RAM).
 * 3. Si existe en pieceSvgFallbackRegistry, lo resuelve desde el registro.
 */
export function resolvePieceSvg(piece: { id: string; svgContent?: string }): string {
  if (typeof piece.svgContent === 'string' && piece.svgContent.length > 0) {
    return piece.svgContent;
  }
  if ('svgContent' in piece && (piece.svgContent === undefined || piece.svgContent === '')) {
    return '';
  }

  const tmpl = pieceTemplateRegistry.get(piece.id);
  if (tmpl) {
    const baseArt = baseArtworkRegistry.get(tmpl.templateKey) || '';
    return `
      <g id="${tmpl.uniquePieceId}">
        <defs>
          <clipPath id="${tmpl.maskId}">
            <path d="${tmpl.svgPathData}"${tmpl.translateTransform} />
          </clipPath>
        </defs>
        <!-- Arte recortado exactamente con el molde -->
        <g clip-path="url(#${tmpl.maskId})">
          ${baseArt}
          ${tmpl.dorsalSvg}
          ${tmpl.sizeMarkSvg}
        </g>
      </g>
    `.trim();
  }

  return pieceSvgFallbackRegistry.get(piece.id) || '';
}

/**
 * Obtiene el path SVG local (en origen 0,0) del contorno de corte de una pieza en O(1)
 * desde pieceTemplateRegistry, o lo calcula a partir de su cutPolygon como fallback.
 */
export function getPieceMoldPath(piece: { id: string; cutPolygon: Point2D[] }): string {
  const cachedPath = pieceTemplateRegistry.get(piece.id)?.svgPathData;
  if (cachedPath) return cachedPath;

  if (!piece.cutPolygon || piece.cutPolygon.length === 0) return '';
  const bbox = computeBoundingBox(piece.cutPolygon);
  const localPolygon = (bbox.minX !== 0 || bbox.minY !== 0)
    ? piece.cutPolygon.map((pt) => ({ x: pt.x - bbox.minX, y: pt.y - bbox.minY }))
    : piece.cutPolygon;
  return polygonToSvgPath(localPolygon);
}

/**
 * Limpia los registros Flyweight de piezas y plantillas base.
 */
export function clearPieceSvgRegistry(): void {
  pieceSvgRegistry.clear();
}

const ARTWORK_CACHE_LIMIT = 64;
const VECTOR_TEXT_CACHE_LIMIT = 256;

/**
 * Calcula una huella rápida determinista FNV-1a (32-bit) más la longitud del SVG.
 */
function computeArtworkFingerprint(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(36)}_${content.length}`;
}

function getFromLruCache<V>(cache: Map<string, V>, key: string): V | undefined {
  const val = cache.get(key);
  if (val !== undefined) {
    cache.delete(key);
    cache.set(key, val);
  }
  return val;
}

function setInLruCache<V>(
  cache: Map<string, V>,
  key: string,
  value: V,
  limit: number = ARTWORK_CACHE_LIMIT
): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= limit) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, value);
}

// Caché de normalización de mesas de trabajo por huella del contenido SVG base (LRU máx. 64)
const normalizedArtworkCache = new Map<string, string>();

export function getCachedNormalizedArtwork(rawSvgContent: string): string {
  const cacheKey = computeArtworkFingerprint(rawSvgContent);
  let cached = getFromLruCache(normalizedArtworkCache, cacheKey);
  if (cached !== undefined) return cached;

  const withoutText = rawSvgContent.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, '');
  cached = normalizeArtworkSvgForMold(withoutText);
  setInLruCache(normalizedArtworkCache, cacheKey, cached);
  return cached;
}

// Caché de arte normalizado y con IDs aislados (namespaced) por diseño y tipo de pieza (SIN artOffsetY ni dimensiones)
const namespacedArtworkCache = new Map<string, string>();

export function getCachedNormalizedNamespacedArtwork(
  designId: string,
  pieceType: PieceType | string,
  rawArtSvg: string,
  preserveAspectRatioMode: string = 'xMidYMid slice'
): string {
  const artFingerprint = computeArtworkFingerprint(rawArtSvg);
  const cacheKey = `${designId}_${pieceType}_${preserveAspectRatioMode}_${artFingerprint}`;
  const cached = getFromLruCache(namespacedArtworkCache, cacheKey);
  if (cached !== undefined) return cached;

  const normalizedSvg = getCachedNormalizedArtwork(rawArtSvg);
  const needsNamespacing =
    normalizedSvg.includes('id=') ||
    normalizedSvg.includes('ID=') ||
    normalizedSvg.includes('<style') ||
    normalizedSvg.includes('<STYLE');
  const namespaced = needsNamespacing
    ? namespaceSvgIds(normalizedSvg, `art_${designId}_${pieceType}`)
    : normalizedSvg;

  setInLruCache(namespacedArtworkCache, cacheKey, namespaced);
  return namespaced;
}

export function getCachedNamespacedArtwork(
  scaledArtSvg: string,
  cacheKey: string
): string {
  const cached = getFromLruCache(namespacedArtworkCache, cacheKey);
  if (cached !== undefined) return cached;

  const namespaced = scaledArtSvg.includes('id=') || scaledArtSvg.includes('<style')
    ? namespaceSvgIds(scaledArtSvg, cacheKey)
    : scaledArtSvg;

  setInLruCache(namespacedArtworkCache, cacheKey, namespaced);
  return namespaced;
}

// Caché de arte escalado por molde, talla, offset y huella del arte (LRU máx. 64)
const scaledArtworkCache = new Map<string, string>();

export function getCachedScaledArtwork(
  rawArtSvg: string,
  width: number,
  height: number,
  artOffsetY: number,
  cacheKeyPrefix: string,
  designId: string = 'des',
  pieceType: PieceType | string = 'piece',
  preserveAspectRatioMode: string = 'xMidYMid slice'
): string {
  const artFingerprint = computeArtworkFingerprint(rawArtSvg);
  const cacheKey = `${cacheKeyPrefix}_${artFingerprint}_${width.toFixed(1)}_${height.toFixed(1)}_${artOffsetY}_${preserveAspectRatioMode}`;
  const cached = getFromLruCache(scaledArtworkCache, cacheKey);
  if (cached !== undefined) return cached;

  // Inversión de caché: primero normalizar + aislar IDs una sola vez (independiente de artOffsetY y dimensiones)
  const namespacedArtSvg = getCachedNormalizedNamespacedArtwork(
    designId,
    pieceType,
    rawArtSvg,
    preserveAspectRatioMode
  );

  // Después ajustar únicamente la etiqueta <svg> raíz (< 0.01 ms)
  let scaledArtSvg = namespacedArtSvg;
  if (scaledArtSvg.includes('<svg')) {
    scaledArtSvg = scaledArtSvg.replace(/<svg\b([^>]*)>/i, (_, attrs: string) => {
      const clean = attrs
        .replace(/\bx\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\by\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\bpreserveAspectRatio\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\boverflow\s*=\s*["'][^"']*["']/gi, '')
        .trim();
      return `<svg x="0" y="${artOffsetY}" width="${width}" height="${height}" preserveAspectRatio="${preserveAspectRatioMode}" overflow="hidden"${clean ? ' ' + clean : ''}>`;
    });
  }

  setInLruCache(scaledArtworkCache, cacheKey, scaledArtSvg);
  return scaledArtSvg;
}

// Cachés LRU para vectorización de dorsales y marcas de talla (evita invocar OpenType.js al calibrar arte)
export const dorsalVectorCache = new Map<string, { svg: string; warnings: string[] }>();
export const sizeMarkVectorCache = new Map<string, { svg: string; warnings: string[] }>();

interface PreparedMoldPiece {
  patternPiece: PatternPiece;
  localCutPolygon: PatternPiece['cutPolygon'];
  localBbox: PatternPiece['bbox'];
  svgPathData: string;
  translateTransform: string;
}

interface PreparedSizeMolds {
  hasPieces: boolean;
  delanteroV?: PreparedMoldPiece;
  delanteroRedondo?: PreparedMoldPiece;
  espalda?: PreparedMoldPiece;
  mangaIzq?: PreparedMoldPiece;
  mangaDer?: PreparedMoldPiece;
  pantaIzq?: PreparedMoldPiece;
  pantaDer?: PreparedMoldPiece;
}

const moldGeometryCache = new Map<string, PreparedMoldPiece>();

function getPreparedMoldPiece(patternPiece: PatternPiece): PreparedMoldPiece {
  const firstPt = patternPiece.cutPolygon[0];
  const lastPt = patternPiece.cutPolygon[patternPiece.cutPolygon.length - 1];
  const cacheKey = `${patternPiece.id}_${patternPiece.cutPolygon.length}_${firstPt ? `${firstPt.x},${firstPt.y}` : '0'}_${lastPt ? `${lastPt.x},${lastPt.y}` : '0'}_${patternPiece.bbox.width}_${patternPiece.bbox.height}`;
  const cached = getFromLruCache(moldGeometryCache, cacheKey);
  if (cached !== undefined) return cached;

  const hasPolygon = patternPiece.cutPolygon.length > 0;
  const bbox = hasPolygon
    ? computeBoundingBox(patternPiece.cutPolygon)
    : patternPiece.bbox;
  const localCutPolygon = hasPolygon
    ? patternPiece.cutPolygon.map((pt) => ({
        x: pt.x - bbox.minX,
        y: pt.y - bbox.minY,
      }))
    : patternPiece.cutPolygon;
  const localBbox = hasPolygon ? computeBoundingBox(localCutPolygon) : patternPiece.bbox;
  const svgPathData = hasPolygon
    ? polygonToSvgPath(localCutPolygon)
    : patternPiece.svgPathData;
  const translateTransform = !hasPolygon && (bbox.minX !== 0 || bbox.minY !== 0)
    ? ` transform="translate(-${bbox.minX}, -${bbox.minY})"`
    : '';

  const prepared: PreparedMoldPiece = {
    patternPiece,
    localCutPolygon,
    localBbox,
    svgPathData,
    translateTransform,
  };
  setInLruCache(moldGeometryCache, cacheKey, prepared, VECTOR_TEXT_CACHE_LIMIT);
  return prepared;
}

function buildPreparedSizeMolds(sizePieces: PatternPiece[]): PreparedSizeMolds {
  if (!sizePieces || sizePieces.length === 0) {
    return { hasPieces: false };
  }

  const delanteros = sizePieces.filter(
    (p) => p.pieceType === 'DELANTERO' || p.pieceType === 'DELANTERO_V' || p.pieceType === 'DELANTERO_REDONDO'
  );
  const rawDelanteroV =
    delanteros.find((p) => p.pieceType === 'DELANTERO_V') ||
    delanteros.find((p) => p.pieceType === 'DELANTERO');
  const rawDelanteroRedondo =
    delanteros.find((p) => p.pieceType === 'DELANTERO_REDONDO') ||
    delanteros.find((p) => p.pieceType === 'DELANTERO');

  const rawEspalda = sizePieces.find((p) => p.pieceType === 'ESPALDA');

  let rawMangaIzq = sizePieces.find((p) => p.pieceType === 'MANGA_IZQ');
  let rawMangaDer = sizePieces.find((p) => p.pieceType === 'MANGA_DER');
  if (!rawMangaIzq && !rawMangaDer) {
    const genericManga = sizePieces.find((p) => p.pieceType.startsWith('MANGA'));
    if (genericManga) {
      const w = genericManga.bbox.width;
      const mirroredPoly = genericManga.cutPolygon.map((pt) => ({
        x: Number((w - pt.x).toFixed(2)),
        y: pt.y,
      }));
      rawMangaIzq = {
        ...genericManga,
        id: `${genericManga.id}_izq`,
        pieceType: 'MANGA_IZQ',
        pieceName: `${genericManga.pieceName}_IZQ`,
      };
      rawMangaDer = {
        ...genericManga,
        id: `${genericManga.id}_der`,
        pieceType: 'MANGA_DER',
        pieceName: `${genericManga.pieceName}_DER`,
        cutPolygon: mirroredPoly,
        svgPathData: polygonToSvgPath(mirroredPoly),
      };
    }
  } else if (rawMangaIzq && !rawMangaDer) {
    const w = rawMangaIzq.bbox.width;
    const mirroredPoly = rawMangaIzq.cutPolygon.map((pt) => ({
      x: Number((w - pt.x).toFixed(2)),
      y: pt.y,
    }));
    rawMangaDer = {
      ...rawMangaIzq,
      id: `${rawMangaIzq.id}_der`,
      pieceType: 'MANGA_DER',
      pieceName: `${rawMangaIzq.pieceName}_DER`,
      cutPolygon: mirroredPoly,
      svgPathData: polygonToSvgPath(mirroredPoly),
    };
  } else if (rawMangaDer && !rawMangaIzq) {
    const w = rawMangaDer.bbox.width;
    const mirroredPoly = rawMangaDer.cutPolygon.map((pt) => ({
      x: Number((w - pt.x).toFixed(2)),
      y: pt.y,
    }));
    rawMangaIzq = {
      ...rawMangaDer,
      id: `${rawMangaDer.id}_izq`,
      pieceType: 'MANGA_IZQ',
      pieceName: `${rawMangaDer.pieceName}_IZQ`,
      cutPolygon: mirroredPoly,
      svgPathData: polygonToSvgPath(mirroredPoly),
    };
  }

  let rawPantaIzq = sizePieces.find((p) => p.pieceType === 'PANTALONETA_IZQ' || p.pieceType === 'SHORT_FRENTE');
  let rawPantaDer = sizePieces.find((p) => p.pieceType === 'PANTALONETA_DER' || p.pieceType === 'SHORT_ESPALDA');
  if (!rawPantaIzq && !rawPantaDer) {
    const genericShort = sizePieces.find((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'));
    if (genericShort) {
      const w = genericShort.bbox.width;
      const mirroredPoly = genericShort.cutPolygon.map((pt) => ({
        x: Number((w - pt.x).toFixed(2)),
        y: pt.y,
      }));
      rawPantaIzq = {
        ...genericShort,
        id: `${genericShort.id}_izq`,
        pieceType: 'PANTALONETA_IZQ',
        pieceName: `${genericShort.pieceName}_IZQ`,
      };
      rawPantaDer = {
        ...genericShort,
        id: `${genericShort.id}_der`,
        pieceType: 'PANTALONETA_DER',
        pieceName: `${genericShort.pieceName}_DER`,
        cutPolygon: mirroredPoly,
        svgPathData: polygonToSvgPath(mirroredPoly),
      };
    }
  } else if (rawPantaIzq && !rawPantaDer) {
    const w = rawPantaIzq.bbox.width;
    const mirroredPoly = rawPantaIzq.cutPolygon.map((pt) => ({
      x: Number((w - pt.x).toFixed(2)),
      y: pt.y,
    }));
    rawPantaDer = {
      ...rawPantaIzq,
      id: `${rawPantaIzq.id}_der`,
      pieceType: 'PANTALONETA_DER',
      pieceName: `${rawPantaIzq.pieceName}_DER`,
      cutPolygon: mirroredPoly,
      svgPathData: polygonToSvgPath(mirroredPoly),
    };
  } else if (rawPantaDer && !rawPantaIzq) {
    const w = rawPantaDer.bbox.width;
    const mirroredPoly = rawPantaDer.cutPolygon.map((pt) => ({
      x: Number((w - pt.x).toFixed(2)),
      y: pt.y,
    }));
    rawPantaIzq = {
      ...rawPantaDer,
      id: `${rawPantaDer.id}_izq`,
      pieceType: 'PANTALONETA_IZQ',
      pieceName: `${rawPantaDer.pieceName}_IZQ`,
      cutPolygon: mirroredPoly,
      svgPathData: polygonToSvgPath(mirroredPoly),
    };
  }

  return {
    hasPieces: true,
    delanteroV: rawDelanteroV ? getPreparedMoldPiece(rawDelanteroV) : undefined,
    delanteroRedondo: rawDelanteroRedondo ? getPreparedMoldPiece(rawDelanteroRedondo) : undefined,
    espalda: rawEspalda ? getPreparedMoldPiece(rawEspalda) : undefined,
    mangaIzq: rawMangaIzq ? getPreparedMoldPiece(rawMangaIzq) : undefined,
    mangaDer: rawMangaDer ? getPreparedMoldPiece(rawMangaDer) : undefined,
    pantaIzq: rawPantaIzq ? getPreparedMoldPiece(rawPantaIzq) : undefined,
    pantaDer: rawPantaDer ? getPreparedMoldPiece(rawPantaDer) : undefined,
  };
}

/**
 * Limpia todas las cachés del generador (normalización, escalado, namespacing, dorsales, moldes y registro de piezas).
 */
export function clearGeneratorCaches(): void {
  normalizedArtworkCache.clear();
  scaledArtworkCache.clear();
  namespacedArtworkCache.clear();
  dorsalVectorCache.clear();
  sizeMarkVectorCache.clear();
  moldGeometryCache.clear();
  pieceSvgRegistry.clear();
}

/**
 * Genera el ensamble vectorial completo de cada prenda uniendo Molde + Diseño + Jugador
 */
export function generateGarmentPieces(
  orderItems: OrderItem[],
  patternSet: PatternSet,
  masterDesign: MasterDesign,
  customConfig: Partial<GenerationConfig> = {}
): GenerationResult {
  pieceSvgRegistry.clear();
  const config: GenerationConfig = { ...DEFAULT_CONFIG, ...customConfig };
  const generatedPieces: GeneratedPiece[] = [];
  const warnings: string[] = [];

  const bySize: Record<string, number> = {};
  const byPieceType: Record<string, number> = {};

  let totalGarmentsCount = 0;

  // Pre-calcular la geometría local y espejado de moldes una sola vez por talla fuera del bucle de jugadores
  const preparedSizesMap = new Map<string, PreparedSizeMolds>();
  for (const sizeEntry of patternSet.sizes) {
    const normSize = normalizeSizeName(sizeEntry.sizeName).toUpperCase();
    if (!preparedSizesMap.has(normSize)) {
      preparedSizesMap.set(normSize, buildPreparedSizeMolds(sizeEntry.pieces));
    }
  }

  for (const orderItem of orderItems) {
    if (!orderItem.isValid) {
      warnings.push(`Fila #${orderItem.rowNumber} (${orderItem.playerName}): Se omitió por contener errores de validación.`);
      continue;
    }

    const targetSize = normalizeSizeName(orderItem.sizeName).toUpperCase();

    // 1. Buscar talla pre-calculada correspondiente en el conjunto de moldes
    const preparedSize = preparedSizesMap.get(targetSize);

    // Nunca sustituir silenciosamente una talla: en producción una etiqueta T28 debe
    // corresponder a geometría T28 real. Generar con otra talla produciría una prenda
    // físicamente incorrecta aunque la etiqueta y el pedido parezcan válidos.
    if (!preparedSize || !preparedSize.hasPieces) {
      warnings.push(`Jugador ${orderItem.playerName}: la talla "${orderItem.sizeName}" no existe o no tiene piezas en el molde. No se generó para evitar sustituirla por otra talla.`);
      continue;
    }

    // Determinar tipo de prenda efectivo considerando el alcance de producción configurado
    const effectiveGarmentType = (config.productionScope === 'CAMISETA_ONLY')
      ? 'CAMISETA'
      : (config.productionScope === 'SHORT_ONLY')
      ? 'SHORT'
      : orderItem.garmentType;

    const wantsNecklineV = orderItem.necklineType === 'V'
      || (!orderItem.necklineType && (orderItem.notes || '').toUpperCase().includes('V'));

    const chosenDelantero = wantsNecklineV
      ? preparedSize.delanteroV
      : preparedSize.delanteroRedondo;
    const espaldaPiece = preparedSize.espalda;
    const mangaIzq = preparedSize.mangaIzq;
    const mangaDer = preparedSize.mangaDer;
    const pantaIzq = (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO')
      ? preparedSize.pantaIzq
      : undefined;
    const pantaDer = (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO')
      ? preparedSize.pantaDer
      : undefined;

    // 5. Construir lista final de piezas preparadas para este jugador
    const piecesToGenerate: PreparedMoldPiece[] = [];
    if (effectiveGarmentType === 'CAMISETA' || effectiveGarmentType === 'COMPLETO') {
      if (chosenDelantero) piecesToGenerate.push(chosenDelantero);
      if (espaldaPiece) piecesToGenerate.push(espaldaPiece);
      if (mangaIzq) piecesToGenerate.push(mangaIzq);
      if (mangaDer) piecesToGenerate.push(mangaDer);
    }
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      if (pantaDer) piecesToGenerate.push(pantaDer);
      if (pantaIzq) piecesToGenerate.push(pantaIzq);
    }

    const missingPieceGroups: string[] = [];
    if (effectiveGarmentType === 'CAMISETA' || effectiveGarmentType === 'COMPLETO') {
      if (!chosenDelantero) missingPieceGroups.push(`delantero con cuello ${orderItem.necklineType === 'V' ? 'V' : 'redondo'}`);
      if (!espaldaPiece) missingPieceGroups.push('espalda');
      if (!mangaIzq || !mangaDer) missingPieceGroups.push('par de mangas');
    }
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      if (!pantaIzq || !pantaDer) missingPieceGroups.push('par de pantalonetas');
    }
    if (missingPieceGroups.length > 0) {
      warnings.push(`Jugador ${orderItem.playerName}, talla ${orderItem.sizeName}: faltan ${missingPieceGroups.join(', ')} en esa talla. No se generó el uniforme incompleto ni se usaron piezas de otra talla.`);
      continue;
    }

    // Un arte ausente nunca debe sustituirse por un relleno inventado en producción.
    const missingArtworkGroups: string[] = [];

    if (effectiveGarmentType === 'CAMISETA' || effectiveGarmentType === 'COMPLETO') {
      const hasFrontArtwork = Boolean(
        masterDesign.pieceArtworks['DELANTERO'] ||
        masterDesign.pieceArtworks['DELANTERO_REDONDO'] ||
        masterDesign.pieceArtworks['DELANTERO_V']
      );

      if (!hasFrontArtwork) {
        missingArtworkGroups.push('diseño del frente');
      }
      if (!masterDesign.pieceArtworks['ESPALDA']) missingArtworkGroups.push('diseño de la espalda');
      if (!masterDesign.pieceArtworks['MANGA_IZQ'] && !masterDesign.pieceArtworks['MANGA_DER']) {
        missingArtworkGroups.push('diseño de manga');
      }
    }
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      const hasLeftShort = Boolean(masterDesign.pieceArtworks['SHORT_FRENTE'] || masterDesign.pieceArtworks['PANTALONETA_IZQ']);
      const hasRightShort = Boolean(masterDesign.pieceArtworks['SHORT_ESPALDA'] || masterDesign.pieceArtworks['PANTALONETA_DER']);
      const hasAnyShort = hasLeftShort || hasRightShort || Boolean((masterDesign.pieceArtworks as any)['SHORT']);

      // En confección deportiva, si se subió un arte para pantaloneta se aplica o espeja a ambas piernas.
      // Si no se subió arte específico pero el diseño tiene colores, se genera al tono con su dorsal.
      // Solo se advierte si no hay artes de pantaloneta ni colores definidos.
      if (!hasAnyShort && (!masterDesign.colors || masterDesign.colors.length === 0)) {
        missingArtworkGroups.push('diseño de pantaloneta');
      }
    }
    if (missingArtworkGroups.length > 0) {
      warnings.push(`Jugador ${orderItem.playerName}: faltan ${missingArtworkGroups.join(', ')}. No se generó para evitar imprimir piezas con un fondo genérico.`);
      continue;
    }

    totalGarmentsCount += orderItem.quantity;

    if (piecesToGenerate.length === 0) {
      warnings.push(`Jugador ${orderItem.playerName}: No hay piezas de tipo "${effectiveGarmentType}" en la talla ${orderItem.sizeName}.`);
      continue;
    }

    // Para cada pieza requerida, generar las variantes según la cantidad
    for (let q = 1; q <= orderItem.quantity; q++) {
      for (let pieceIndex = 0; pieceIndex < piecesToGenerate.length; pieceIndex++) {
        const preparedPiece = piecesToGenerate[pieceIndex];
        const patternPiece = preparedPiece.patternPiece;
        const pieceType = patternPiece.pieceType;
        const maskId = `mask_${orderItem.id}_${patternPiece.id}_${q}`;
        const uniquePieceId = `gen_${orderItem.id}_${pieceIndex}_${pieceType}_${q}`;

        const { localCutPolygon, localBbox, svgPathData: localSvgPathData, translateTransform } = preparedPiece;

        // 2. Extraer o generar arte base del diseño maestro para esta pieza
        let artwork = masterDesign.pieceArtworks[pieceType];
        if (!artwork) {
          if (pieceType === 'DELANTERO_V' || (pieceType === 'DELANTERO' && wantsNecklineV)) {
            artwork = masterDesign.pieceArtworks['DELANTERO_V'] || masterDesign.pieceArtworks['DELANTERO'] || masterDesign.pieceArtworks['DELANTERO_REDONDO'];
          } else if (pieceType === 'DELANTERO_REDONDO' || (pieceType === 'DELANTERO' && !wantsNecklineV)) {
            artwork = masterDesign.pieceArtworks['DELANTERO_REDONDO'] || masterDesign.pieceArtworks['DELANTERO'] || masterDesign.pieceArtworks['DELANTERO_V'];
          } else if (pieceType.startsWith('DELANTERO')) {
            artwork = masterDesign.pieceArtworks['DELANTERO'] || masterDesign.pieceArtworks['DELANTERO_REDONDO'] || masterDesign.pieceArtworks['DELANTERO_V'];
          } else if (pieceType === 'MANGA_DER') {
            artwork = masterDesign.pieceArtworks['MANGA_DER'] || masterDesign.pieceArtworks['MANGA_IZQ'] || masterDesign.pieceArtworks['MANGA' as PieceType];
          } else if (pieceType === 'MANGA_IZQ') {
            artwork = masterDesign.pieceArtworks['MANGA_IZQ'] || masterDesign.pieceArtworks['MANGA_DER'] || masterDesign.pieceArtworks['MANGA' as PieceType];
          } else if (pieceType === 'PANTALONETA_IZQ' || pieceType === 'SHORT_FRENTE') {
            artwork = masterDesign.pieceArtworks['PANTALONETA_IZQ'] || masterDesign.pieceArtworks['SHORT_FRENTE'] || masterDesign.pieceArtworks['PANTALONETA_DER'];
          } else if (pieceType === 'PANTALONETA_DER' || pieceType === 'SHORT_ESPALDA') {
            artwork = masterDesign.pieceArtworks['PANTALONETA_DER'] || masterDesign.pieceArtworks['SHORT_ESPALDA'] || masterDesign.pieceArtworks['PANTALONETA_IZQ'];
          }
        }
        const primaryColor = masterDesign.colors[0] || '#ea580c';
        const secondaryColor = masterDesign.colors[1] || '#0284c7';
        const accentColor = masterDesign.colors[2] || '#ffffff';

        const baseArtSvg = artwork?.svgArtContent || `
          <rect width="${localBbox.width}" height="${localBbox.height}" fill="${primaryColor}" />
          <path d="M 0,${localBbox.height * 0.3} L ${localBbox.width},${localBbox.height * 0.45} L ${localBbox.width},${localBbox.height * 0.52} L 0,${localBbox.height * 0.37} Z" fill="${secondaryColor}" opacity="0.4" />
        `;

        // Extraer configuraciones de tipografía y color maestro del diseño (Espalda / Dorsal oficial)
        const espaldaArt = masterDesign.pieceArtworks['ESPALDA'];
        const espaldaNamePlaceholder = espaldaArt?.placeholders?.find((p) => p.id === 'NOMBRE');
        const espaldaNumPlaceholder = espaldaArt?.placeholders?.find((p) => p.id === 'NUMERO_ESPALDA' || p.id.includes('NUMERO'));
        const masterPlaceholder = espaldaNumPlaceholder || espaldaNamePlaceholder;

        const configuredFont = masterPlaceholder?.fontFamily
          || artwork?.placeholders?.find((p) => p.fontFamily)?.fontFamily
          || 'Bebas Neue';
        const configuredFill = masterPlaceholder?.fillColor
          || artwork?.placeholders?.find((p) => p.fillColor)?.fillColor
          || accentColor;
        const configuredStroke = masterPlaceholder?.strokeColor
          || artwork?.placeholders?.find((p) => p.strokeColor)?.strokeColor
          || '#000000';
        const configuredStrokeWidth = masterPlaceholder?.strokeWidthMm !== undefined
          ? masterPlaceholder.strokeWidthMm
          : (artwork?.placeholders?.find((p) => p.strokeWidthMm !== undefined)?.strokeWidthMm ?? 2.5);

        const typographyKey = `${configuredFont}|${configuredFill}|${configuredStroke}|${configuredStrokeWidth}`;

        // 3. Aplicar personalización de texto y números (DORSAL CENTRADO EN MM FÍSICOS Y PROPORCIONADO)
        let dorsalSvg = '';
        if (pieceType === 'ESPALDA') {
          const nameOffsetRatio = (config.nameVerticalOffsetPercent ?? 0) / 100;
          const numOffsetRatio = (config.numberVerticalOffsetPercent ?? 0) / 100;
          const nameScaleX = config.nameScaleX ?? 1.0;
          const nameScaleY = config.nameScaleY ?? 1.0;
          const numScaleX = config.numberScaleX ?? (config.numberScaleFactor ?? 1.0);
          const numScaleY = config.numberScaleY ?? (config.numberScaleFactor ?? 1.0);

          const backDorsalConfigKey = `${nameOffsetRatio}_${numOffsetRatio}_${nameScaleX}_${nameScaleY}_${numScaleX}_${numScaleY}`;
          const backCacheKey = `BACK|${orderItem.playerName}|${orderItem.playerNumber}|${targetSize}|${localBbox.width.toFixed(2)}|${localBbox.height.toFixed(2)}|${backDorsalConfigKey}|${typographyKey}`;
          let cachedBack = getFromLruCache(dorsalVectorCache, backCacheKey);

          if (!cachedBack) {
            const centerX = localBbox.width / 2;
            const isYouth = localBbox.height < 580;

            const baseNameRatio = isYouth ? 0.22 : 0.21;
            const nameY = localBbox.height * Math.max(0.12, Math.min(0.35, baseNameRatio + nameOffsetRatio));

            const baseNumRatio = isYouth ? 0.50 : 0.50;
            const numberY = localBbox.height * Math.max(0.30, Math.min(0.68, baseNumRatio + numOffsetRatio));

            const nameFontSize = isYouth 
              ? Math.min(32, Math.max(24, localBbox.width * 0.08))
              : Math.min(38, Math.max(28, localBbox.width * 0.085));

            const numberFontSize = isYouth
              ? Math.min(150, Math.max(110, localBbox.height * 0.26))
              : Math.min(190, Math.max(140, localBbox.height * 0.27));

            const nameRule: DynamicPlaceholderRule = {
              id: 'NOMBRE',
              tag: '{{NOMBRE}}',
              targetPiece: 'ESPALDA',
              anchorX: centerX,
              anchorY: nameY,
              maxWidthMm: localBbox.width * 0.65,
              maxHeightMm: isYouth ? 38 : 45,
              defaultFontSizeMm: nameFontSize,
              minFontSizeMm: 20,
              minScaleFactor: 0.50,
              fontFamily: configuredFont,
              fillColor: configuredFill,
              strokeColor: configuredStroke,
              strokeWidthMm: configuredStrokeWidth,
              textAlign: 'center',
              customScaleX: nameScaleX,
              customScaleY: nameScaleY,
            };

            const numberRule: DynamicPlaceholderRule = {
              id: 'NUMERO_ESPALDA',
              tag: '{{NUMERO}}',
              targetPiece: 'ESPALDA',
              anchorX: centerX,
              anchorY: numberY,
              maxWidthMm: localBbox.width * 0.55,
              maxHeightMm: isYouth ? 155 : 200,
              defaultFontSizeMm: numberFontSize,
              minFontSizeMm: 100,
              minScaleFactor: 0.60,
              fontFamily: configuredFont,
              fillColor: configuredFill,
              strokeColor: configuredStroke,
              strokeWidthMm: configuredStrokeWidth > 0 ? Math.max(configuredStrokeWidth, 3.0) : 0,
              textAlign: 'center',
              customScaleX: numScaleX,
              customScaleY: numScaleY,
            };

            const nameFitting = computeTextFitting(orderItem.playerName, nameRule);
            const numberFitting = computeTextFitting(orderItem.playerNumber, numberRule);

            cachedBack = {
              svg: `${nameFitting.svgContent}\u0000${numberFitting.svgContent}`,
              warnings: [],
            };
            setInLruCache(dorsalVectorCache, backCacheKey, cachedBack, VECTOR_TEXT_CACHE_LIMIT);
          }

          const [nameSvgContent, numberSvgContent] = cachedBack.svg.split('\u0000');
          dorsalSvg = `
            <!-- Dorsal Oficial: Nombre y Número centrados en mm reales -->
            <g id="dorsal_nombre_${uniquePieceId}">
              ${nameSvgContent}
            </g>
            <g id="dorsal_numero_${uniquePieceId}">
              ${numberSvgContent}
            </g>
          `;
        }

        // Número dinámico de pantaloneta. El SVG base debe traer únicamente el
        // fondo, franjas y logotipos fijos; el dorsal proviene de la nómina.
        const isShortLeft = pieceType === 'PANTALONETA_IZQ' || pieceType === 'SHORT_FRENTE';
        const isShortRight = pieceType === 'PANTALONETA_DER' || pieceType === 'SHORT_ESPALDA';
        const isSelectedShortPiece = config.shortNumberPiece === 'IZQ' ? isShortLeft : isShortRight;
        if (config.includeShortNumber !== false && isSelectedShortPiece) {
          const xPercent = Math.max(10, Math.min(90, config.shortNumberXPercent ?? 50));
          const yPercent = Math.max(15, Math.min(85, config.shortNumberYPercent ?? 45));
          const shortScale = Math.max(0.4, Math.min(2.5, config.shortNumberScale ?? 1));
          const shortScaleX = config.shortNumberScaleX ?? 1.0;
          const shortScaleY = config.shortNumberScaleY ?? 1.0;
          const shortCacheKey = `SHORT|${orderItem.playerNumber}|${pieceType}|${targetSize}|${localBbox.width.toFixed(2)}|${localBbox.height.toFixed(2)}|${xPercent}_${yPercent}_${shortScale}_${shortScaleX}_${shortScaleY}|${typographyKey}`;
          let cachedShort = getFromLruCache(dorsalVectorCache, shortCacheKey);

          if (!cachedShort) {
            const shortNumberSize = Math.min(95, Math.max(45, localBbox.height * 0.28)) * shortScale;
            const shortNumberRule: DynamicPlaceholderRule = {
              id: 'NUMERO_SHORT',
              tag: '{{NUMERO_SHORT}}',
              targetPiece: pieceType,
              anchorX: localBbox.width * (xPercent / 100),
              anchorY: localBbox.height * (yPercent / 100),
              maxWidthMm: localBbox.width * 0.42,
              maxHeightMm: localBbox.height * 0.42,
              defaultFontSizeMm: shortNumberSize,
              minFontSizeMm: Math.max(28, shortNumberSize * 0.6),
              minScaleFactor: 0.55,
              fontFamily: configuredFont,
              fillColor: configuredFill,
              strokeColor: configuredStroke,
              strokeWidthMm: configuredStrokeWidth,
              textAlign: 'center',
              customScaleX: shortScaleX,
              customScaleY: shortScaleY,
            };
            const shortNumberFitting = computeTextFitting(orderItem.playerNumber, shortNumberRule);
            cachedShort = { svg: shortNumberFitting.svgContent, warnings: [] };
            setInLruCache(dorsalVectorCache, shortCacheKey, cachedShort, VECTOR_TEXT_CACHE_LIMIT);
          }

          dorsalSvg = `
            <g id="short_numero_${uniquePieceId}" data-hmb-role="short-number">
              ${cachedShort.svg}
            </g>
          `;
        }

        // Número dinámico en Delantero (pecho / frente de camiseta, ej: selecciones nacionales o dorsales frontales)
        const isDelantero = pieceType === 'DELANTERO' || pieceType === 'DELANTERO_REDONDO' || pieceType === 'DELANTERO_V';
        if (config.includeFrontNumber && isDelantero) {
          let xPercent = config.frontNumberXPercent ?? 50;
          if (config.frontNumberPosition === 'CENTRO') xPercent = 50;
          else if (config.frontNumberPosition === 'DERECHA') xPercent = 68;
          else if (config.frontNumberPosition === 'IZQUIERDA') xPercent = 32;

          const yPercent = Math.max(15, Math.min(85, config.frontNumberYPercent ?? 38));
          const frontScale = Math.max(0.3, Math.min(2.5, config.frontNumberScale ?? 1.0));
          const frontCacheKey = `FRONT|${orderItem.playerNumber}|${pieceType}|${targetSize}|${localBbox.width.toFixed(2)}|${localBbox.height.toFixed(2)}|${xPercent}_${yPercent}_${frontScale}|${typographyKey}`;
          let cachedFront = getFromLruCache(dorsalVectorCache, frontCacheKey);

          if (!cachedFront) {
            const isYouth = localBbox.height < 580;
            const baseFrontSize = isYouth
              ? Math.min(65, Math.max(45, localBbox.height * 0.12))
              : Math.min(90, Math.max(60, localBbox.height * 0.13));
            const frontNumberSize = baseFrontSize * frontScale;

            const frontNumberRule: DynamicPlaceholderRule = {
              id: 'NUMERO_FRENTE',
              tag: '{{NUMERO_FRENTE}}',
              targetPiece: pieceType,
              anchorX: localBbox.width * (xPercent / 100),
              anchorY: localBbox.height * (yPercent / 100),
              maxWidthMm: localBbox.width * 0.35,
              maxHeightMm: localBbox.height * 0.25,
              defaultFontSizeMm: frontNumberSize,
              minFontSizeMm: Math.max(20, frontNumberSize * 0.6),
              minScaleFactor: 0.55,
              fontFamily: configuredFont,
              fillColor: configuredFill,
              strokeColor: configuredStroke,
              strokeWidthMm: configuredStrokeWidth > 0 ? Math.max(configuredStrokeWidth * 0.75, 1.5) : 0,
              textAlign: 'center',
            };

            const frontNumberFitting = computeTextFitting(orderItem.playerNumber, frontNumberRule);
            cachedFront = { svg: frontNumberFitting.svgContent, warnings: [] };
            setInLruCache(dorsalVectorCache, frontCacheKey, cachedFront, VECTOR_TEXT_CACHE_LIMIT);
          }

          dorsalSvg = `
            <!-- Número Delantero / Pecho Oficial vectorizado a curvas -->
            <g id="delantero_numero_${uniquePieceId}" data-hmb-role="front-number">
              ${cachedFront.svg}
            </g>
          `;
        }

        // Marca interior de talla para confección. Usa la misma fuente vectorial
        // ya validada para el dorsal, por lo que Illustrator recibe curvas.
        let sizeMarkSvg = '';
        if (config.includeSizeMark) {
          const sizeFontSize = Math.max(3, Math.min(20, config.sizeMarkFontSizeMm ?? 8));
          const bottomOffset = Math.max(-20, Math.min(localBbox.height * 0.25, config.sizeMarkBottomOffsetMm ?? 8));
          const sizeColor = config.sizeMarkColor || '#000000';
          const sizeMarkCacheKey = `SIZE|${orderItem.sizeName}|${pieceType}|${targetSize}|${localBbox.width.toFixed(2)}|${localBbox.height.toFixed(2)}|${sizeFontSize}_${bottomOffset}_${configuredFont}_${sizeColor}`;
          let cachedSizeMark = getFromLruCache(sizeMarkVectorCache, sizeMarkCacheKey);

          if (!cachedSizeMark) {
            const sizeRule: DynamicPlaceholderRule = {
              id: 'TALLA_PIEZA',
              tag: '{{TALLA}}',
              targetPiece: pieceType,
              anchorX: localBbox.width / 2,
              anchorY: localBbox.height - bottomOffset - (sizeFontSize / 2),
              maxWidthMm: Math.max(20, localBbox.width * 0.35),
              maxHeightMm: sizeFontSize * 1.25,
              defaultFontSizeMm: sizeFontSize,
              minFontSizeMm: Math.max(3, sizeFontSize * 0.7),
              minScaleFactor: 0.65,
              fontFamily: configuredFont,
              fillColor: sizeColor,
              strokeWidthMm: 0,
              textAlign: 'center',
            };
            const sizeFitting = computeTextFitting(orderItem.sizeName, sizeRule);
            cachedSizeMark = { svg: sizeFitting.svgContent, warnings: [] };
            setInLruCache(sizeMarkVectorCache, sizeMarkCacheKey, cachedSizeMark, VECTOR_TEXT_CACHE_LIMIT);
          }

          sizeMarkSvg = `
            <g id="size_mark_${uniquePieceId}" data-hmb-role="size-mark">
              ${cachedSizeMark.svg}
            </g>
          `;
        }

        // 4. Etiqueta de identificación para corte y confección fuera del margen de costura
        const labelText = `${orderItem.playerName} | #${orderItem.playerNumber} | T${orderItem.sizeName} | ${pieceType}`;
        const labelInfo: PieceLabelInfo = {
          text: labelText,
          anchorX: localBbox.width / 2,
          anchorY: localBbox.height + config.labelDistanceMm,
          fontSizeMm: config.labelFontSizeMm,
          isVisible: config.includeLabels,
        };

        // Normalizar y escalar arte vectorial usando caché invertida por molde/talla para evitar trabajo redundante
        let artOffsetY = 0;
        if (pieceType.startsWith('MANGA')) {
          artOffsetY = config.sleeveArtOffsetYMm ?? 0;
        } else if (pieceType.startsWith('DELANTERO')) {
          artOffsetY = config.frontArtOffsetYMm ?? 0;
        } else if (pieceType === 'ESPALDA') {
          artOffsetY = config.backArtOffsetYMm ?? 0;
        } else if (pieceType.startsWith('PANTALONETA') || pieceType.startsWith('SHORT')) {
          artOffsetY = config.shortArtOffsetYMm ?? 0;
        }

        const designId = masterDesign.id || 'des';
        const cachePrefix = `${designId}_${patternPiece.id || pieceType}_${targetSize}`;
        const templateKey = `${cachePrefix}_${artOffsetY}`;

        // Guardar plantilla base de la talla (compartida por todos los jugadores de esta talla)
        if (!baseArtworkRegistry.has(templateKey)) {
          const scaledAndNamespacedArt = getCachedScaledArtwork(
            baseArtSvg,
            localBbox.width,
            localBbox.height,
            artOffsetY,
            cachePrefix,
            designId,
            pieceType
          );
          baseArtworkRegistry.set(templateKey, scaledAndNamespacedArt);
        }

        // Registrar metadatos ligeros de la pieza (Cero duplicación de memoria RAM)
        pieceTemplateRegistry.set(uniquePieceId, {
          templateKey,
          uniquePieceId,
          maskId,
          svgPathData: localSvgPathData,
          translateTransform,
          dorsalSvg,
          sizeMarkSvg,
        });

        const genPiece: GeneratedPiece = {
          id: uniquePieceId,
          orderItemId: orderItem.id,
          pieceId: patternPiece.id,
          playerName: orderItem.playerName,
          playerNumber: orderItem.playerNumber,
          sizeName: orderItem.sizeName,
          pieceType,
          pieceName: `${orderItem.playerName}_#${orderItem.playerNumber}_T${orderItem.sizeName}_${pieceType}`,
          cutPolygon: localCutPolygon,
          bbox: localBbox,
          areaMm2: patternPiece.areaMm2,
          allowedRotationsDeg: patternPiece.allowedRotationsDeg,
          svgMaskId: maskId,
          get svgContent(): string {
            return pieceSvgRegistry.get(this.id) || '';
          },
          set svgContent(val: string | undefined) {
            if (val !== undefined) {
              pieceSvgRegistry.set(this.id, val);
            } else {
              pieceSvgRegistry.delete(this.id);
            }
          },
          label: labelInfo,
        };

        generatedPieces.push(genPiece);

        // Contadores
        bySize[orderItem.sizeName] = (bySize[orderItem.sizeName] || 0) + 1;
        byPieceType[pieceType] = (byPieceType[pieceType] || 0) + 1;
      }
    }
  }

  return {
    pieces: generatedPieces,
    totalPieces: generatedPieces.length,
    totalGarments: totalGarmentsCount,
    bySize,
    byPieceType,
    warnings,
  };
}

/**
 * Filtra piezas para la función de Reimpresión de emergencia
 */
export function filterReprintPieces(
  allPieces: GeneratedPiece[],
  filter: {
    orderItemId?: string;
    playerName?: string;
    sizeName?: string;
    pieceType?: PieceType;
  }
): GeneratedPiece[] {
  return allPieces.filter((p) => {
    if (filter.orderItemId && p.orderItemId !== filter.orderItemId) return false;
    if (filter.playerName && p.playerName.toUpperCase() !== filter.playerName.toUpperCase()) return false;
    if (filter.sizeName && p.sizeName.toUpperCase() !== filter.sizeName.toUpperCase()) return false;
    if (filter.pieceType && p.pieceType !== filter.pieceType) return false;
    return true;
  });
}
