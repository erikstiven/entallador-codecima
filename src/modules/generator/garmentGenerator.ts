import { OrderItem } from '@/modules/orders/types';
import { PatternSet, PatternPiece, PieceType } from '@/modules/patterns/types';
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
  includeShortNumber: true,
  shortNumberPiece: 'DER',
  shortNumberXPercent: 50,
  shortNumberYPercent: 45,
  shortNumberScale: 1,
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
 * Limpia los registros Flyweight de piezas y plantillas base.
 */
export function clearPieceSvgRegistry(): void {
  pieceSvgRegistry.clear();
}

const ARTWORK_CACHE_LIMIT = 64;

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

function getFromLruCache(cache: Map<string, string>, key: string): string | undefined {
  const val = cache.get(key);
  if (val !== undefined) {
    cache.delete(key);
    cache.set(key, val);
  }
  return val;
}

function setInLruCache(cache: Map<string, string>, key: string, value: string): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= ARTWORK_CACHE_LIMIT) {
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

// Caché de arte escalado por molde, talla y huella del arte (LRU máx. 64)
const scaledArtworkCache = new Map<string, string>();

export function getCachedScaledArtwork(
  rawArtSvg: string,
  width: number,
  height: number,
  artOffsetY: number,
  cacheKeyPrefix: string
): string {
  const artFingerprint = computeArtworkFingerprint(rawArtSvg);
  const cacheKey = `${cacheKeyPrefix}_${artFingerprint}_${width.toFixed(1)}_${height.toFixed(1)}_${artOffsetY}`;
  const cached = getFromLruCache(scaledArtworkCache, cacheKey);
  if (cached !== undefined) return cached;

  const cleanArtSvg = getCachedNormalizedArtwork(rawArtSvg);
  let scaledArtSvg = cleanArtSvg;
  if (scaledArtSvg.includes('<svg')) {
    scaledArtSvg = scaledArtSvg.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
      const clean = attrs
        .replace(/\bwidth\s*=\s*["'][^"']+["']/gi, '')
        .replace(/\bheight\s*=\s*["'][^"']+["']/gi, '')
        .replace(/\bpreserveAspectRatio\s*=\s*["'][^"']+["']/gi, '');
      return `<svg x="0" y="${artOffsetY}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" ${clean}>`;
    });
  }

  setInLruCache(scaledArtworkCache, cacheKey, scaledArtSvg);
  return scaledArtSvg;
}

// Caché de arte con IDs aislados (namespaced) por molde y talla (LRU máx. 64)
const namespacedArtworkCache = new Map<string, string>();

export function getCachedNamespacedArtwork(
  scaledArtSvg: string,
  cacheKey: string
): string {
  const cached = getFromLruCache(namespacedArtworkCache, cacheKey);
  if (cached !== undefined) return cached;

  const namespaced = scaledArtSvg.includes('id=')
    ? namespaceSvgIds(scaledArtSvg, cacheKey)
    : scaledArtSvg;

  setInLruCache(namespacedArtworkCache, cacheKey, namespaced);
  return namespaced;
}

/**
 * Limpia todas las cachés del generador (normalización, escalado, namespacing y registro de piezas).
 */
export function clearGeneratorCaches(): void {
  normalizedArtworkCache.clear();
  scaledArtworkCache.clear();
  namespacedArtworkCache.clear();
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

  for (const orderItem of orderItems) {
    if (!orderItem.isValid) {
      warnings.push(`Fila #${orderItem.rowNumber} (${orderItem.playerName}): Se omitió por contener errores de validación.`);
      continue;
    }

    const targetSize = normalizeSizeName(orderItem.sizeName).toUpperCase();

    // 1. Buscar talla correspondiente en el conjunto de moldes
    let sizeObj = patternSet.sizes.find(
      (s) => normalizeSizeName(s.sizeName).toUpperCase() === targetSize
    );

    // Nunca sustituir silenciosamente una talla: en producción una etiqueta T28 debe
    // corresponder a geometría T28 real. Generar con otra talla produciría una prenda
    // físicamente incorrecta aunque la etiqueta y el pedido parezcan válidos.
    if (!sizeObj || sizeObj.pieces.length === 0) {
      warnings.push(`Jugador ${orderItem.playerName}: la talla "${orderItem.sizeName}" no existe o no tiene piezas en el molde. No se generó para evitar sustituirla por otra talla.`);
      continue;
    }

    // Determinar tipo de prenda efectivo considerando el alcance de producción configurado
    const effectiveGarmentType = (config.productionScope === 'CAMISETA_ONLY')
      ? 'CAMISETA'
      : (config.productionScope === 'SHORT_ONLY')
      ? 'SHORT'
      : orderItem.garmentType;

    // 1. Delantero: exactamente 1 pieza
    const delanteros = sizeObj.pieces.filter((p) =>
      p.pieceType === 'DELANTERO' || p.pieceType === 'DELANTERO_V' || p.pieceType === 'DELANTERO_REDONDO'
    );
    let chosenDelantero: PatternPiece | undefined;
    if (delanteros.length > 0) {
      const wantsV = orderItem.necklineType === 'V'
        || (!orderItem.necklineType && (orderItem.notes || '').toUpperCase().includes('V'));
      if (wantsV) {
        chosenDelantero = delanteros.find((p) => p.pieceType === 'DELANTERO_V')
          || delanteros.find((p) => p.pieceType === 'DELANTERO');
      } else {
        chosenDelantero = delanteros.find((p) => p.pieceType === 'DELANTERO_REDONDO')
          || delanteros.find((p) => p.pieceType === 'DELANTERO');
      }
    }

    // 2. Espalda: exactamente 1 pieza
    let espaldaPiece = sizeObj.pieces.find((p) => p.pieceType === 'ESPALDA');

    // 3. Mangas de ESTA talla: exactamente 2 piezas (izquierda y derecha en modo espejo)
    let mangaIzq = sizeObj.pieces.find((p) => p.pieceType === 'MANGA_IZQ');
    let mangaDer = sizeObj.pieces.find((p) => p.pieceType === 'MANGA_DER');
    if (!mangaIzq && !mangaDer) {
      const genericManga = sizeObj.pieces.find((p) => p.pieceType.startsWith('MANGA'));
      if (genericManga) {
        const w = genericManga.bbox.width;
        const mirroredPoly = genericManga.cutPolygon.map((pt) => ({
          x: Number((w - pt.x).toFixed(2)),
          y: pt.y,
        }));
        mangaIzq = { ...genericManga, id: `${genericManga.id}_izq`, pieceType: 'MANGA_IZQ', pieceName: `${genericManga.pieceName}_IZQ` };
        mangaDer = {
          ...genericManga,
          id: `${genericManga.id}_der`,
          pieceType: 'MANGA_DER',
          pieceName: `${genericManga.pieceName}_DER`,
          cutPolygon: mirroredPoly,
          svgPathData: polygonToSvgPath(mirroredPoly),
        };
      }
    } else if (mangaIzq && !mangaDer) {
      const w = mangaIzq.bbox.width;
      const mirroredPoly = mangaIzq.cutPolygon.map((pt) => ({
        x: Number((w - pt.x).toFixed(2)),
        y: pt.y,
      }));
      mangaDer = {
        ...mangaIzq,
        id: `${mangaIzq.id}_der`,
        pieceType: 'MANGA_DER',
        pieceName: `${mangaIzq.pieceName}_DER`,
        cutPolygon: mirroredPoly,
        svgPathData: polygonToSvgPath(mirroredPoly),
      };
    } else if (mangaDer && !mangaIzq) {
      const w = mangaDer.bbox.width;
      const mirroredPoly = mangaDer.cutPolygon.map((pt) => ({
        x: Number((w - pt.x).toFixed(2)),
        y: pt.y,
      }));
      mangaIzq = {
        ...mangaDer,
        id: `${mangaDer.id}_izq`,
        pieceType: 'MANGA_IZQ',
        pieceName: `${mangaDer.pieceName}_IZQ`,
        cutPolygon: mirroredPoly,
        svgPathData: polygonToSvgPath(mirroredPoly),
      };
    }

    // 4. Shorts / Pantalonetas (SOLO SI effectiveGarmentType es 'SHORT' o 'COMPLETO')
    let pantaIzq: PatternPiece | undefined;
    let pantaDer: PatternPiece | undefined;
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      pantaIzq = sizeObj.pieces.find((p) => p.pieceType === 'PANTALONETA_IZQ' || p.pieceType === 'SHORT_FRENTE');
      pantaDer = sizeObj.pieces.find((p) => p.pieceType === 'PANTALONETA_DER' || p.pieceType === 'SHORT_ESPALDA');
      if (!pantaIzq && !pantaDer) {
        const genericShort = sizeObj.pieces.find((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'));
        if (genericShort) {
          pantaIzq = { ...genericShort, id: `${genericShort.id}_izq`, pieceType: 'PANTALONETA_IZQ' };
          pantaDer = { ...genericShort, id: `${genericShort.id}_der`, pieceType: 'PANTALONETA_DER' };
        }
      } else if (pantaIzq && !pantaDer) {
        const w = pantaIzq.bbox.width;
        const mirroredPoly = pantaIzq.cutPolygon.map((pt) => ({
          x: Number((w - pt.x).toFixed(2)),
          y: pt.y,
        }));
        pantaDer = {
          ...pantaIzq,
          id: `${pantaIzq.id}_der`,
          pieceType: 'PANTALONETA_DER',
          pieceName: `${pantaIzq.pieceName}_DER`,
          cutPolygon: mirroredPoly,
          svgPathData: polygonToSvgPath(mirroredPoly),
        };
      } else if (pantaDer && !pantaIzq) {
        const w = pantaDer.bbox.width;
        const mirroredPoly = pantaDer.cutPolygon.map((pt) => ({
          x: Number((w - pt.x).toFixed(2)),
          y: pt.y,
        }));
        pantaIzq = {
          ...pantaDer,
          id: `${pantaDer.id}_izq`,
          pieceType: 'PANTALONETA_IZQ',
          pieceName: `${pantaDer.pieceName}_IZQ`,
          cutPolygon: mirroredPoly,
          svgPathData: polygonToSvgPath(mirroredPoly),
        };
      }
    }

    // 5. Construir lista final de piezas para este jugador
    const piecesToGenerate: PatternPiece[] = [];
    if (effectiveGarmentType === 'CAMISETA' || effectiveGarmentType === 'COMPLETO') {
      if (chosenDelantero) piecesToGenerate.push(chosenDelantero);
      if (espaldaPiece) piecesToGenerate.push(espaldaPiece);
      if (mangaIzq) piecesToGenerate.push(mangaIzq);
      if (mangaDer) piecesToGenerate.push(mangaDer);
    }
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      if (pantaIzq) piecesToGenerate.push(pantaIzq);
      if (pantaDer) piecesToGenerate.push(pantaDer);
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
    const wantsNecklineV = orderItem.necklineType === 'V'
      || (!orderItem.necklineType && (orderItem.notes || '').toUpperCase().includes('V'));

    if (effectiveGarmentType === 'CAMISETA' || effectiveGarmentType === 'COMPLETO') {
      const hasFrontArtwork = wantsNecklineV
        ? Boolean(masterDesign.pieceArtworks['DELANTERO_V'] || masterDesign.pieceArtworks['DELANTERO'])
        : Boolean(masterDesign.pieceArtworks['DELANTERO_REDONDO'] || masterDesign.pieceArtworks['DELANTERO']);

      if (!hasFrontArtwork) {
        missingArtworkGroups.push(`diseño del frente (cuello ${wantsNecklineV ? 'V' : 'redondo'})`);
      }
      if (!masterDesign.pieceArtworks['ESPALDA']) missingArtworkGroups.push('diseño de la espalda');
      if (!masterDesign.pieceArtworks['MANGA_IZQ'] && !masterDesign.pieceArtworks['MANGA_DER']) {
        missingArtworkGroups.push('diseño de manga');
      }
    }
    if (effectiveGarmentType === 'SHORT' || effectiveGarmentType === 'COMPLETO') {
      if (!masterDesign.pieceArtworks['SHORT_FRENTE'] && !masterDesign.pieceArtworks['PANTALONETA_IZQ']) {
        missingArtworkGroups.push('diseño de la pierna izquierda');
      }
      if (!masterDesign.pieceArtworks['SHORT_ESPALDA'] && !masterDesign.pieceArtworks['PANTALONETA_DER']) {
        missingArtworkGroups.push('diseño de la pierna derecha');
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
        const patternPiece = piecesToGenerate[pieceIndex];
        const pieceType = patternPiece.pieceType;
        const maskId = `mask_${orderItem.id}_${patternPiece.id}_${q}`;
        const uniquePieceId = `gen_${orderItem.id}_${pieceIndex}_${pieceType}_${q}`;

        // Normalizar polígono de corte al origen local (0, 0)
        const bbox = patternPiece.cutPolygon.length > 0
          ? computeBoundingBox(patternPiece.cutPolygon)
          : patternPiece.bbox;
        const localCutPolygon = patternPiece.cutPolygon.map((pt) => ({
          x: pt.x - bbox.minX,
          y: pt.y - bbox.minY,
        }));
        const localBbox = computeBoundingBox(localCutPolygon);
        const translateTransform = (bbox.minX !== 0 || bbox.minY !== 0)
          ? ` transform="translate(-${bbox.minX}, -${bbox.minY})"`
          : '';

        // 2. Extraer o generar arte base del diseño maestro para esta pieza
        let artwork = masterDesign.pieceArtworks[pieceType];
        if (!artwork) {
          if (pieceType === 'DELANTERO_V' || (pieceType === 'DELANTERO' && wantsNecklineV)) {
            artwork = masterDesign.pieceArtworks['DELANTERO_V'] || masterDesign.pieceArtworks['DELANTERO'];
          } else if (pieceType === 'DELANTERO_REDONDO' || (pieceType === 'DELANTERO' && !wantsNecklineV)) {
            artwork = masterDesign.pieceArtworks['DELANTERO_REDONDO'] || masterDesign.pieceArtworks['DELANTERO'];
          } else if (pieceType.startsWith('DELANTERO')) {
            artwork = masterDesign.pieceArtworks['DELANTERO_REDONDO'] || masterDesign.pieceArtworks['DELANTERO_V'] || masterDesign.pieceArtworks['DELANTERO'];
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

        // Extraer configuraciones de tipografía y color de espalda
        const espaldaArt = masterDesign.pieceArtworks['ESPALDA'];
        const configuredFont = artwork?.placeholders?.find((p) => p.fontFamily)?.fontFamily
          || espaldaArt?.placeholders?.find((p) => p.fontFamily)?.fontFamily
          || 'Bebas Neue';
        const configuredFill = artwork?.placeholders?.find((p) => p.fillColor)?.fillColor
          || espaldaArt?.placeholders?.find((p) => p.fillColor)?.fillColor
          || accentColor;
        const configuredStroke = artwork?.placeholders?.find((p) => p.strokeColor)?.strokeColor
          || espaldaArt?.placeholders?.find((p) => p.strokeColor)?.strokeColor
          || '#000000';
        const configuredStrokeWidth = artwork?.placeholders?.find((p) => p.strokeWidthMm !== undefined)?.strokeWidthMm
          ?? espaldaArt?.placeholders?.find((p) => p.strokeWidthMm !== undefined)?.strokeWidthMm
          ?? 2.5;

        // 3. Aplicar personalización de texto y números (DORSAL CENTRADO EN MM FÍSICOS Y PROPORCIONADO)
        let dorsalSvg = '';
        if (pieceType === 'ESPALDA') {
          // Coordenadas físicas en milímetros centradas en la pieza real
          const centerX = localBbox.width / 2;
          const isYouth = localBbox.height < 580;

          const nameOffsetRatio = (config.nameVerticalOffsetPercent ?? 0) / 100;
          const numOffsetRatio = (config.numberVerticalOffsetPercent ?? 0) / 100;
          const nameScaleX = config.nameScaleX ?? 1.0;
          const nameScaleY = config.nameScaleY ?? 1.0;
          const numScaleX = config.numberScaleX ?? (config.numberScaleFactor ?? 1.0);
          const numScaleY = config.numberScaleY ?? (config.numberScaleFactor ?? 1.0);

          // Nombre: en la espalda alta (posicionado a ~21-22% de altura, debajo del escote)
          const baseNameRatio = isYouth ? 0.22 : 0.21;
          const nameY = localBbox.height * Math.max(0.12, Math.min(0.35, baseNameRatio + nameOffsetRatio));

          // Número: centrado en la parte media de la espalda (a ~50% de altura)
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

          dorsalSvg = `
            <!-- Dorsal Oficial: Nombre y Número centrados en mm reales -->
            <g id="dorsal_nombre_${uniquePieceId}">
              ${nameFitting.svgContent}
            </g>
            <g id="dorsal_numero_${uniquePieceId}">
              ${numberFitting.svgContent}
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
          };
          const shortNumberFitting = computeTextFitting(orderItem.playerNumber, shortNumberRule);
          dorsalSvg = `
            <g id="short_numero_${uniquePieceId}" data-hmb-role="short-number">
              ${shortNumberFitting.svgContent}
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
          dorsalSvg = `
            <!-- Número Delantero / Pecho Oficial vectorizado a curvas -->
            <g id="delantero_numero_${uniquePieceId}" data-hmb-role="front-number">
              ${frontNumberFitting.svgContent}
            </g>
          `;
        }

        // Marca interior de talla para confección. Usa la misma fuente vectorial
        // ya validada para el dorsal, por lo que Illustrator recibe curvas.
        let sizeMarkSvg = '';
        if (config.includeSizeMark) {
          const sizeFontSize = Math.max(3, Math.min(20, config.sizeMarkFontSizeMm ?? 8));
          const bottomOffset = Math.max(-20, Math.min(localBbox.height * 0.25, config.sizeMarkBottomOffsetMm ?? 8));
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
            fillColor: config.sizeMarkColor || '#000000',
            strokeWidthMm: 0,
            textAlign: 'center',
          };
          const sizeFitting = computeTextFitting(orderItem.sizeName, sizeRule);
          sizeMarkSvg = `
            <g id="size_mark_${uniquePieceId}" data-hmb-role="size-mark">
              ${sizeFitting.svgContent}
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

        // Normalizar y escalar arte vectorial usando caché por molde/talla para evitar trabajo redundante
        let artOffsetY = 0;
        if (pieceType.startsWith('MANGA')) {
          artOffsetY = config.sleeveArtOffsetYMm ?? 0;
        } else if (pieceType.startsWith('DELANTERO')) {
          artOffsetY = config.frontArtOffsetYMm ?? 0;
        } else if (pieceType === 'ESPALDA') {
          artOffsetY = config.backArtOffsetYMm ?? 0;
        }

        const cachePrefix = `${masterDesign.id || 'des'}_${patternPiece.id || pieceType}_${targetSize}`;
        const scaledArtSvg = getCachedScaledArtwork(
          baseArtSvg,
          localBbox.width,
          localBbox.height,
          artOffsetY,
          cachePrefix
        );

        const templateKey = `${cachePrefix}_${artOffsetY}`;
        const namespacedArt = getCachedNamespacedArtwork(
          scaledArtSvg,
          templateKey
        );

        // Guardar plantilla base de la talla (compartida por todos los jugadores de esta talla)
        if (!baseArtworkRegistry.has(templateKey)) {
          baseArtworkRegistry.set(templateKey, namespacedArt);
        }

        // Registrar metadatos ligeros de la pieza (Cero duplicación de memoria RAM)
        pieceTemplateRegistry.set(uniquePieceId, {
          templateKey,
          uniquePieceId,
          maskId,
          svgPathData: patternPiece.svgPathData,
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
