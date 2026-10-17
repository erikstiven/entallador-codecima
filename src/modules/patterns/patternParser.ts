import { 
  PatternSet, 
  PatternSize, 
  PatternPiece, 
  PieceType, 
  SvgParseResult 
} from './types';
import { extractSvgViewport, parseSvgPathToPolygon, SvgViewport } from '@/core/svg/svgPathParser';
import { computeBoundingBox, calculatePolygonArea, polygonToSvgPath } from '@/core/geometry/transform';
import { normalizeSizeName } from '@/modules/orders/orderValidator';

/**
 * Expresión regular para clasificar el tipo de pieza a partir de su identificador
 */
/**
 * Detecta si un identificador o texto tiene indicios de pierna/manga izquierda o derecha.
 * Soporta nomenclaturas industriales de patronaje:
 * - Izquierda: "26_I", "26-I", "26 I", "T26_I", "26_IZQ", "26-IZQ", "26 IZQ", "SHORT_I", "SHORT_F", "IZQUIERDA", "LEFT", "_L"
 * - Derecha: "26_D", "26-D", "26 D", "T26_D", "26_DER", "26-DER", "26 DER", "SHORT_D", "SHORT_A", "SHORT_E", "DERECHA", "RIGHT", "_R"
 */
export function detectSideSuffix(text: string): 'IZQ' | 'DER' | null {
  const clean = text.toUpperCase().trim();

  // 1. Detección de lado Izquierdo (Frente / Pierna Izquierda / Manga Izquierda)
  if (
    /(?:^|[-_\s])(IZQ|IZQUIERDA|I|L|LEFT|F|FRENTE)(?:[-_\s]|$)/i.test(clean) ||
    clean.endsWith('_I') ||
    clean.endsWith('-I') ||
    clean.endsWith(' I')
  ) {
    return 'IZQ';
  }

  // 2. Detección de lado Derecho (Espalda / Pierna Derecha / Manga Derecha)
  if (
    /(?:^|[-_\s])(DER|DERECHA|D|R|RIGHT|E|A|TRASERO|ESPALDA)(?:[-_\s]|$)/i.test(clean) ||
    clean.endsWith('_D') ||
    clean.endsWith('-D') ||
    clean.endsWith(' D')
  ) {
    return 'DER';
  }

  return null;
}

/**
 * Clasifica el tipo de pieza a partir de su identificador o texto asociado,
 * con soporte para contexto geométrico opcional (short, manga, torso).
 */
export function detectPieceType(
  identifier: string,
  context?: { isShort?: boolean; isSleeve?: boolean }
): PieceType | null {
  const clean = identifier.toUpperCase().trim();

  // Ignorar identificadores sintéticos genéricos generados por el parser o editores (ej: "PATH_1", "PATH_2")
  if (/^(?:PATH|ELEMENT|SHAPE|POLY|RECT|LINE|ITEM|LAYER|CAPA|OBJETO)[-_\s]?\d+$/i.test(clean)) {
    return null;
  }

  if (clean.includes('CUELLO_V') || clean.includes('DELANTERO_V') || clean.includes('FRENTE_V') || clean.includes('V_NECK') || clean.includes('_V')) {
    return 'DELANTERO_V';
  }
  if (clean.includes('CUELLO_RED') || clean.includes('DELANTERO_RED') || clean.includes('ROUND_NECK') || clean.includes('_REDONDO')) {
    return 'DELANTERO_REDONDO';
  }
  if ((clean.includes('DELANTERO') || clean.includes('FRENTE') || clean.includes('FRONT')) && !clean.includes('SHORT') && !clean.includes('PANTALONETA')) {
    return 'DELANTERO';
  }
  if ((clean.includes('ESPALDA') || clean.includes('TRASERO') || clean.includes('BACK')) && !clean.includes('SHORT') && !clean.includes('PANTALONETA')) {
    return 'ESPALDA';
  }

  // Mangas
  if (clean.includes('MANGA_I') || clean.includes('MANGA_IZQ') || clean.includes('SLEEVE_L') || clean.includes('MANGA_IZQUIERDA')) {
    return 'MANGA_IZQ';
  }
  if (clean.includes('MANGA_D') || clean.includes('MANGA_DER') || clean.includes('SLEEVE_R') || clean.includes('MANGA_DERECHA')) {
    return 'MANGA_DER';
  }
  if (clean.includes('MANGA') || clean.includes('SLEEVE')) {
    const side = detectSideSuffix(clean);
    if (side === 'DER') return 'MANGA_DER';
    return 'MANGA_IZQ';
  }

  // Cuello / Rib
  if (clean.includes('CUELLO') || clean.includes('COLLAR') || clean.includes('RIB')) {
    return 'CUELLO';
  }

  // Shorts / Pantalonetas con palabras explícitas
  const isExplicitShort = clean.includes('PANTALONETA') || clean.includes('SHORT') || clean.includes('BERMUDA');
  if (isExplicitShort) {
    const side = detectSideSuffix(clean);
    if (side === 'DER') return 'PANTALONETA_DER';
    return 'PANTALONETA_IZQ';
  }

  // Detección contextual por sufijo de lado (ej. "26_I", "26_D", "26-I", "26-D", "T26_I", "T26_D")
  const side = detectSideSuffix(clean);
  if (side && context?.isShort) {
    return side === 'DER' ? 'PANTALONETA_DER' : 'PANTALONETA_IZQ';
  }
  if (side && context?.isSleeve) {
    return side === 'DER' ? 'MANGA_DER' : 'MANGA_IZQ';
  }

  return null;
}

/**
 * Expresión regular para extraer la talla de un identificador o texto (ej. "T28", "TALLA_30", "SZ_S", "M", "26_I", "26 D", "26")
 */
export function detectSizeName(identifier: string): string | null {
  const clean = identifier.toUpperCase().trim();

  // Ignorar identificadores sintéticos genéricos generados por el parser o editores (ej: "PATH_1", "PATH_2", "ELEMENT_1", "SHAPE_1")
  if (/^(?:PATH|ELEMENT|SHAPE|POLY|RECT|LINE|ITEM|LAYER|CAPA|OBJETO)[-_\s]?\d+$/i.test(clean)) {
    return null;
  }

  // Patrón 0: Número o talla sola como "26", "28", "30", "S", "M", "L", "XL", "XXL"
  if (/^\b(XXL|XL|XS|S|M|L|\d{1,2})\b$/i.test(clean)) {
    return normalizeSizeName(clean);
  }

  // Patrón 1: T28, TALLA28, T_28, TALLA_30, SZ_28, TALLA 28, T 28
  const matchNum = clean.match(/(?:TALLA|T|SZ)[-_\s]?(\d+)/i);
  if (matchNum) {
    return matchNum[1];
  }

  // Patrón 2: Talla alfanumérica al inicio o entre delimitadores: T_S, TALLA_M, T_XL, TS_, TALLA S
  const matchAlpha = clean.match(/(?:TALLA|T|SZ)[-_\s]?(XXL|XL|XS|S|M|L)(?:[-_\s]|\b)/i);
  if (matchAlpha) {
    return matchAlpha[1];
  }

  // Patrón 3: Si contiene delimitadores con talla al inicio o en el medio (ej. "28_DELANTERO", "26_I", "26 D", "M_ESPALDA")
  const matchDirect = clean.match(/\b(\d+|XXL|XL|XS|S|M|L)[-_\s]/i);
  if (matchDirect) {
    return normalizeSizeName(matchDirect[1]);
  }

  // Patrón 4: Talla numérica o alfanumérica al final del identificador precedida por delimitador (ej. "DELANTERO_REDONDO_28", "ESPALDA_28", "MANGA_IZQ_S", "CORTE_DELANTERO_V_30")
  const matchSuffix = clean.match(/[-_\s](\d+|XXL|XL|XS|S|M|L)$/i);
  if (matchSuffix) {
    return normalizeSizeName(matchSuffix[1]);
  }

  return null;
}

/**
 * Asigna reglas de rotación permitidas según la ergonomía del molde y dirección de tela
 */
export function getDefaultRotationsForPieceType(pieceType: PieceType): number[] {
  switch (pieceType) {
    case 'DELANTERO':
    case 'DELANTERO_V':
    case 'DELANTERO_REDONDO':
    case 'ESPALDA':
      return [0]; // Estricto: 0° únicamente (diseño frontal o dorsal vertical)
    case 'MANGA_IZQ':
    case 'MANGA_DER':
      // En sublimación el motor ya acomoda mangas a 90°/270°. Mantener
      // las cuatro orientaciones disponibles también para el ajuste manual.
      return [0, 90, 180, 270];
    case 'PANTALONETA_IZQ':
    case 'PANTALONETA_DER':
    case 'SHORT_FRENTE':
    case 'SHORT_ESPALDA':
      return [0, 180]; // Permite giro de 180° si la trama del diseño lo admite
    case 'CUELLO':
      return [0, 90, 180, 270]; // Rotación libre para piezas pequeñas de rib / cuello
    default:
      return [0];
  }
}

interface ExtractedTextLabel {
  text: string;
  x: number;
  y: number;
}

/**
 * Extrae etiquetas de texto presentes en el SVG para asociar tallas flotantes a las piezas
 */
function extractTextLabels(svgContent: string, viewport: SvgViewport): ExtractedTextLabel[] {
  const labels: ExtractedTextLabel[] = [];
  const textTagRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;

  while ((match = textTagRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    let innerContent = match[2];
    innerContent = innerContent.replace(/<[^>]+>/g, ' ').trim();
    if (!innerContent) continue;

    let x = 0;
    let y = 0;

    const matrixMatch = attrs.match(/transform\s*=\s*["']matrix\s*\(\s*([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)[,\s]+([^\s,]+)\s*\)["']/i);
    const translateMatch = attrs.match(/transform\s*=\s*["'][^"']*translate\s*\(\s*([^\s,]+)[,\s]+([^\s,]+)\s*\)/i);

    if (matrixMatch) {
      x = parseFloat(matrixMatch[5]) || 0;
      y = parseFloat(matrixMatch[6]) || 0;
    } else if (translateMatch) {
      x = parseFloat(translateMatch[1]) || 0;
      y = parseFloat(translateMatch[2]) || 0;
    } else {
      const xMatch = attrs.match(/\bx\s*=\s*["']([^"']+)["']/i);
      const yMatch = attrs.match(/\by\s*=\s*["']([^"']+)["']/i);
      if (xMatch) x = parseFloat(xMatch[1]) || 0;
      if (yMatch) y = parseFloat(yMatch[1]) || 0;
    }

    const realX = (x - viewport.minX) * viewport.scaleX;
    const realY = (y - viewport.minY) * viewport.scaleY;

    labels.push({
      text: innerContent,
      x: realX,
      y: realY,
    });
  }

  return labels;
}

/**
 * Parsea un SVG completo extrayendo trazados vectoriales, calculando contornos 1:1 y agrupando por talla
 */
export function parsePatternSvg(
  svgContent: string,
  setName: string = 'Colección de Moldes',
  garmentType: string = 'FUTBOL',
  sourceFileName?: string
): SvgParseResult {
  const viewport = extractSvgViewport(svgContent);
  const textLabels = extractTextLabels(svgContent, viewport);
  const warnings: string[] = [];

  // Buscar todos los tags <path ...> con id y d
  const pathRegex = /<path\b([^>]*)\/?>/gi;
  let match;

  const parsedPieces: PatternPiece[] = [];
  const sizeMap: Record<string, PatternPiece[]> = {};
  const unassignedPieces: PatternPiece[] = [];

  let elementIndex = 0;

  while ((match = pathRegex.exec(svgContent)) !== null) {
    elementIndex++;
    const attrs = match[1];

    // Extraer d="..."
    const dMatch = attrs.match(/\bd\s*=\s*["']([^"']+)["']/i);
    if (!dMatch) continue;
    const d = dMatch[1];

    // Extraer id="..." o data-name="..." o inkscape:label="..."
    const idMatch = attrs.match(/\b(?:id|data-name|inkscape:label)\s*=\s*["']([^"']+)["']/i);
    let originalId = idMatch ? idMatch[1] : `path_${elementIndex}`;

    // Obtener contexto del grupo contenedor <g ...> inmediato
    const preceding = svgContent.slice(Math.max(0, match.index - 450), match.index);
    const parentGroupMatch = preceding.match(/<g\b([^>]*)>[\s\r\n]*$/i);
    let parentGroupId = '';
    let parentTransformX = 0;
    let parentTransformY = 0;

    if (parentGroupMatch) {
      const gAttrs = parentGroupMatch[1];
      const gIdMatch = gAttrs.match(/\b(?:id|data-name|inkscape:label)\s*=\s*["']([^"']+)["']/i);
      if (gIdMatch) {
        parentGroupId = gIdMatch[1];
      }
      const gTransMatch = gAttrs.match(/\btransform\s*=\s*["'][^"']*translate\s*\(\s*([^\s,]+)[,\s]+([^\s,]+)\s*\)/i);
      if (gTransMatch) {
        parentTransformX = parseFloat(gTransMatch[1]) || 0;
        parentTransformY = parseFloat(gTransMatch[2]) || 0;
      }
    }

    // Si el id es genérico (ej. path_1), verificar si el <path> está dentro de un grupo <g id="...">
    if (originalId.startsWith('path_') && parentGroupId) {
      originalId = parentGroupId;
    }

    // Descartar trazados que correspondan a líneas de costura, marcos de fondo o guías técnicas
    const upperId = (originalId + ' ' + parentGroupId).toUpperCase();
    if (
      upperId.includes('COSTURA') || 
      upperId.includes('SEAM') || 
      upperId.includes('FONDO') || 
      upperId.includes('GUIA') || 
      upperId.includes('GUIDE')
    ) {
      continue;
    }

    // Extraer polígono y métricas en milímetros reales
    const cutPolygon = parseSvgPathToPolygon(d, viewport);
    if (cutPolygon.length < 3) continue; // Descartar trazados degenerados

    // Detectar transformación translate en el path
    let pathTransformX = 0;
    let pathTransformY = 0;
    const pathTransMatch = attrs.match(/\btransform\s*=\s*["'][^"']*translate\s*\(\s*([^\s,]+)[,\s]+([^\s,]+)\s*\)/i);
    if (pathTransMatch) {
      pathTransformX = parseFloat(pathTransMatch[1]) || 0;
      pathTransformY = parseFloat(pathTransMatch[2]) || 0;
    }

    const totalTx = (pathTransformX + parentTransformX) * viewport.scaleX;
    const totalTy = (pathTransformY + parentTransformY) * viewport.scaleY;

    if (totalTx !== 0 || totalTy !== 0) {
      cutPolygon.forEach((pt) => {
        pt.x += totalTx;
        pt.y += totalTy;
      });
    }

    const bbox = computeBoundingBox(cutPolygon);
    const areaMm2 = calculatePolygonArea(cutPolygon);

    // Descartar trazados insignificantes o líneas guía internas (ej. líneas de escote o piquetes)
    if (areaMm2 < 8000 || bbox.width < 60 || bbox.height < 60) continue;

    // Contexto geométrico físico
    const isShortGeo = bbox.height >= 320 && areaMm2 >= 130000;
    const isSleeveGeo = bbox.height <= 300 && bbox.width > bbox.height * 1.15 && areaMm2 < 130000;

    // Intentar clasificar automáticamente talla y tipo de pieza usando ID de path y de grupo padre
    let detectedSize = detectSizeName(originalId) || (parentGroupId ? detectSizeName(parentGroupId) : null);
    let detectedType = detectPieceType(originalId, { isShort: isShortGeo, isSleeve: isSleeveGeo }) ||
                       (parentGroupId ? detectPieceType(parentGroupId, { isShort: isShortGeo, isSleeve: isSleeveGeo }) : null);

    // Buscar todas las etiquetas de texto dentro o contiguas a la pieza en posición real de lienzo
    const nearbyLabels: { label: ExtractedTextLabel; dist: number }[] = [];
    let closestLabel: ExtractedTextLabel | null = null;
    let closestDist = Infinity;

    for (const lbl of textLabels) {
      // Distancia euclidiana a la caja delimitadora de la pieza
      const dx = Math.max(0, Math.max(bbox.minX - lbl.x, lbl.x - bbox.maxX));
      const dy = Math.max(0, Math.max(bbox.minY - lbl.y, lbl.y - bbox.maxY));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 420) {
        nearbyLabels.push({ label: lbl, dist });
        if (dist < closestDist) {
          closestDist = dist;
          closestLabel = lbl;
        }
      }
    }

    // Ordenar etiquetas por cercanía y generar texto combinado (resuelve tags separados ej. "34" y "_I")
    nearbyLabels.sort((a, b) => a.dist - b.dist);
    const combinedNearbyText = nearbyLabels.map((item) => item.label.text).join(' ');

    // Si no se detectó talla por el ID, extraerla del texto combinado o más cercano
    if (!detectedSize && nearbyLabels.length > 0) {
      detectedSize = detectSizeName(combinedNearbyText) || (closestLabel ? detectSizeName(closestLabel.text) : null);
    }

    // Si no se detectó el tipo por el ID, extraerlo del texto combinado o más cercano (ej. "34 _I", "26_D", "26 I")
    if (!detectedType && nearbyLabels.length > 0) {
      detectedType = detectPieceType(combinedNearbyText, { isShort: isShortGeo, isSleeve: isSleeveGeo }) ||
                     (closestLabel ? detectPieceType(closestLabel.text, { isShort: isShortGeo, isSleeve: isSleeveGeo }) : null);
    }

    // Heurística geométrica para clasificar el tipo de pieza si no viene en el ID ni en el texto:
    if (!detectedType) {
      if ((bbox.height >= 450 && bbox.height > bbox.width) || (areaMm2 >= 95000 && Math.min(bbox.width, bbox.height) >= 380)) {
        // Torso: delantero o espalda (se refinará en post-procesamiento por escote/área)
        const existingForSize = sizeMap[detectedSize || ''] || [];
        const hasDelantero = existingForSize.some((p) => p.pieceType.includes('DELANTERO'));
        detectedType = hasDelantero ? 'ESPALDA' : 'DELANTERO';
      } else if (isSleeveGeo) {
        // Manga corta de fútbol
        detectedType = 'MANGA_IZQ';
      } else if (isShortGeo) {
        // Pantaloneta / Short
        detectedType = 'PANTALONETA_IZQ';
      } else if (bbox.width > bbox.height * 2.2 && bbox.height <= 140) {
        // Cuello / Rib
        detectedType = 'CUELLO';
      } else {
        detectedType = 'OTRO';
      }
    }

    const isAutoAssigned = Boolean(detectedSize);
    const sizeName = detectedSize || 'SIN_TALLA';
    const pieceType: PieceType = detectedType || 'OTRO';
    const allowedRotationsDeg = getDefaultRotationsForPieceType(pieceType);
    const humanPieceName = detectedSize ? `T${detectedSize}_${pieceType}` : originalId;

    // Normalizar cutPolygon al origen local (0, 0) para que sea autocontenido e independiente del lienzo original
    const normalizedPolygon = cutPolygon.map((p) => ({
      x: Number((p.x - bbox.minX).toFixed(2)),
      y: Number((p.y - bbox.minY).toFixed(2)),
    }));
    const normalizedBbox = {
      minX: 0,
      minY: 0,
      maxX: Number(bbox.width.toFixed(2)),
      maxY: Number(bbox.height.toFixed(2)),
      width: Number(bbox.width.toFixed(2)),
      height: Number(bbox.height.toFixed(2)),
    };
    const pathSvg = polygonToSvgPath(normalizedPolygon);

    const piece: PatternPiece = {
      id: `piece_${originalId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sizeName,
      pieceType,
      pieceName: humanPieceName,
      cutPolygon: normalizedPolygon,
      bbox: normalizedBbox,
      canvasMinX: Number(bbox.minX.toFixed(2)),
      canvasMinY: Number(bbox.minY.toFixed(2)),
      areaMm2,
      allowedRotationsDeg,
      svgPathData: pathSvg,
      originalElementId: originalId,
      placeholders: [],
      isAssigned: isAutoAssigned,
    };

    if (isAutoAssigned) {
      if (!sizeMap[sizeName]) {
        sizeMap[sizeName] = [];
      }
      sizeMap[sizeName].push(piece);
    } else {
      unassignedPieces.push(piece);
      warnings.push(`Pieza "${originalId}" no pudo ser clasificada automáticamente. Requiere asignación manual.`);
    }

    parsedPieces.push(piece);
  }

  // Post-procesado inteligente por talla (resolución de variantes de cuello y lados de pantaloneta):
  for (const sizeName of Object.keys(sizeMap)) {
    const piecesInSize = sizeMap[sizeName];
    const isTorso = (p: PatternPiece) => {
      if (p.pieceType.includes('PANTALONETA') || p.pieceType.includes('SHORT') || p.pieceType.includes('MANGA') || p.pieceType.includes('CUELLO')) {
        return false;
      }
      if (p.pieceType.includes('DELANTERO') || p.pieceType.includes('ESPALDA')) {
        return true;
      }
      return (p.bbox.height >= 480 && p.bbox.height > p.bbox.width * 1.05 && p.areaMm2 >= 120000);
    };
    const torsoPieces = piecesInSize.filter(isTorso);

    const getTorsoNeckDrop = (p: PatternPiece): number => {
      if (!p.cutPolygon || p.cutPolygon.length === 0) return 0;
      const minX = p.bbox.minX + p.bbox.width * 0.35;
      const maxX = p.bbox.minX + p.bbox.width * 0.65;
      let deepestDrop = 0;
      for (const pt of p.cutPolygon) {
        if (pt.x >= minX && pt.x <= maxX) {
          const drop = pt.y - p.bbox.minY;
          if (drop > deepestDrop && drop < p.bbox.height * 0.5) {
            deepestDrop = drop;
          }
        }
      }
      return deepestDrop;
    };

    if (torsoPieces.length === 3) {
      // 3 piezas de torso en la misma talla:
      // Si ya vienen con tipos específicos distintos, preservarlos
      const hasEspalda = torsoPieces.some(p => p.pieceType === 'ESPALDA');
      const hasV = torsoPieces.some(p => p.pieceType === 'DELANTERO_V');
      const hasRed = torsoPieces.some(p => p.pieceType === 'DELANTERO_REDONDO');

      if (hasEspalda && hasV && hasRed) {
        torsoPieces.forEach(p => {
          p.pieceName = `T${sizeName}_${p.pieceType}`;
          p.allowedRotationsDeg = getDefaultRotationsForPieceType(p.pieceType);
        });
      } else {
        const drops = torsoPieces.map(getTorsoNeckDrop);
        const minDrop = Math.min(...drops);
        const maxDrop = Math.max(...drops);
        if (maxDrop - minDrop > 15) {
          torsoPieces.sort((a, b) => getTorsoNeckDrop(a) - getTorsoNeckDrop(b));
        } else {
          torsoPieces.sort((a, b) => b.areaMm2 - a.areaMm2);
        }

        torsoPieces[0].pieceType = 'ESPALDA';
        torsoPieces[0].pieceName = `T${sizeName}_ESPALDA`;
        torsoPieces[0].allowedRotationsDeg = getDefaultRotationsForPieceType('ESPALDA');

        torsoPieces[1].pieceType = 'DELANTERO_REDONDO';
        torsoPieces[1].pieceName = `T${sizeName}_DELANTERO_REDONDO`;
        torsoPieces[1].allowedRotationsDeg = getDefaultRotationsForPieceType('DELANTERO_REDONDO');

        torsoPieces[2].pieceType = 'DELANTERO_V';
        torsoPieces[2].pieceName = `T${sizeName}_DELANTERO_V`;
        torsoPieces[2].allowedRotationsDeg = getDefaultRotationsForPieceType('DELANTERO_V');
      }
    } else if (torsoPieces.length === 2) {
      // 2 piezas de torso en la misma talla:
      const hasEspalda = torsoPieces.some(p => p.pieceType === 'ESPALDA');
      const hasV = torsoPieces.some(p => p.pieceType === 'DELANTERO_V');
      const hasRed = torsoPieces.some(p => p.pieceType === 'DELANTERO_REDONDO');

      if (hasEspalda && (hasV || hasRed)) {
        torsoPieces.forEach(p => {
          p.pieceName = `T${sizeName}_${p.pieceType}`;
          p.allowedRotationsDeg = getDefaultRotationsForPieceType(p.pieceType);
        });
      } else {
        const drop0 = getTorsoNeckDrop(torsoPieces[0]);
        const drop1 = getTorsoNeckDrop(torsoPieces[1]);
        if (Math.abs(drop0 - drop1) > 15) {
          torsoPieces.sort((a, b) => getTorsoNeckDrop(a) - getTorsoNeckDrop(b));
        } else {
          torsoPieces.sort((a, b) => b.areaMm2 - a.areaMm2);
        }

        torsoPieces[0].pieceType = 'ESPALDA';
        torsoPieces[0].pieceName = `T${sizeName}_ESPALDA`;
        torsoPieces[0].allowedRotationsDeg = getDefaultRotationsForPieceType('ESPALDA');

        const specificType = (torsoPieces[1].pieceType === 'DELANTERO_V' || torsoPieces[1].pieceType === 'DELANTERO_REDONDO')
          ? torsoPieces[1].pieceType
          : 'DELANTERO';
        torsoPieces[1].pieceType = specificType;
        torsoPieces[1].pieceName = `T${sizeName}_${specificType}`;
        torsoPieces[1].allowedRotationsDeg = getDefaultRotationsForPieceType(specificType);
      }
    }

    // Post-procesado para mangas y pantalonetas en esta talla:
    const nonTorsoPieces = piecesInSize.filter((p) => !isTorso(p));
    const sleeveCandidates = nonTorsoPieces.filter(p => p.pieceType.includes('MANGA') || (p.bbox.height <= 300 && p.bbox.width > p.bbox.height * 1.15 && p.areaMm2 < 130000));
    const pantalonetaCandidates = nonTorsoPieces.filter(p => p.pieceType.includes('PANTALONETA') || p.pieceType.includes('SHORT') || (p.bbox.height >= 300 && p.areaMm2 >= 100000));

    if (sleeveCandidates.length > 0) {
      const hasExplicitIzq = sleeveCandidates.some((p) => p.pieceType === 'MANGA_IZQ');
      const hasExplicitDer = sleeveCandidates.some((p) => p.pieceType === 'MANGA_DER');

      if (sleeveCandidates.length === 2 && hasExplicitIzq && hasExplicitDer) {
        // Ambas mangas ya tienen su lado específico (una IZQ y una DER)
      } else if (sleeveCandidates.length === 2) {
        // Ordenar de izquierda a derecha por posición horizontal original en el lienzo
        sleeveCandidates.sort((a, b) => (a.canvasMinX ?? a.bbox.minX) - (b.canvasMinX ?? b.bbox.minX));
        sleeveCandidates[0].pieceType = 'MANGA_IZQ';
        sleeveCandidates[1].pieceType = 'MANGA_DER';
      } else if (sleeveCandidates.length === 1 && !hasExplicitIzq && !hasExplicitDer) {
        sleeveCandidates[0].pieceType = 'MANGA_IZQ';
      }

      sleeveCandidates.forEach((slv) => {
        slv.pieceName = `T${sizeName}_MANGA`;
        slv.allowedRotationsDeg = getDefaultRotationsForPieceType(slv.pieceType);
      });
    }

    if (pantalonetaCandidates.length > 0) {
      const hasExplicitIzq = pantalonetaCandidates.some((p) => p.pieceType === 'PANTALONETA_IZQ');
      const hasExplicitDer = pantalonetaCandidates.some((p) => p.pieceType === 'PANTALONETA_DER');

      if (pantalonetaCandidates.length === 2 && hasExplicitIzq && hasExplicitDer) {
        // Ambas piernas de pantaloneta ya tienen su lado específico (una IZQ y una DER, ej. "26_I" y "26_D")
      } else if (pantalonetaCandidates.length === 2) {
        // Si no vienen ambas explícitas, ordenar de izquierda a derecha por posición horizontal original en el lienzo (canvasMinX)
        pantalonetaCandidates.sort((a, b) => (a.canvasMinX ?? a.bbox.minX) - (b.canvasMinX ?? b.bbox.minX));
        pantalonetaCandidates[0].pieceType = 'PANTALONETA_IZQ';
        pantalonetaCandidates[1].pieceType = 'PANTALONETA_DER';
      } else if (pantalonetaCandidates.length === 1 && !hasExplicitIzq && !hasExplicitDer) {
        pantalonetaCandidates[0].pieceType = 'PANTALONETA_IZQ';
      }

      pantalonetaCandidates.forEach((pnt) => {
        pnt.pieceName = pnt.pieceType === 'PANTALONETA_DER'
          ? `T${sizeName}_PANTALONETA_DER`
          : `T${sizeName}_PANTALONETA_IZQ`;
        pnt.allowedRotationsDeg = getDefaultRotationsForPieceType(pnt.pieceType);
      });
    }
  }

  // Construir estructura jerárquica de tallas
  const sizes: PatternSize[] = Object.keys(sizeMap)
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    })
    .map((sizeName, idx) => ({
      id: `size_${sizeName}_${Date.now()}`,
      sizeName,
      sortOrder: idx + 1,
      pieces: sizeMap[sizeName],
    }));

  const patternSet: PatternSet = {
    id: `pattern_set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: setName,
    garmentType,
    description: `Conjunto con ${sizes.length} tallas y ${parsedPieces.length} piezas totales.`,
    sourceFileName,
    sizes,
    unassignedPieces,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    patternSet,
    warnings,
    totalParsedElements: parsedPieces.length,
    unassignedCount: unassignedPieces.length,
  };
}
