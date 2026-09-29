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
function detectPieceType(identifier: string): PieceType | null {
  const clean = identifier.toUpperCase();

  if (clean.includes('CUELLO_V') || clean.includes('DELANTERO_V') || clean.includes('FRENTE_V') || clean.includes('V_NECK') || clean.includes('_V')) {
    return 'DELANTERO_V';
  }
  if (clean.includes('CUELLO_RED') || clean.includes('DELANTERO_RED') || clean.includes('ROUND_NECK') || clean.includes('_REDONDO')) {
    return 'DELANTERO_REDONDO';
  }
  if (clean.includes('DELANTERO') || clean.includes('FRENTE') || clean.includes('FRONT')) {
    return 'DELANTERO';
  }
  if (clean.includes('ESPALDA') || clean.includes('TRASERO') || clean.includes('BACK')) {
    return 'ESPALDA';
  }
  if (clean.includes('MANGA_I') || clean.includes('MANGA_IZQ') || clean.includes('SLEEVE_L') || clean.includes('MANGA_IZQUIERDA')) {
    return 'MANGA_IZQ';
  }
  if (clean.includes('MANGA_D') || clean.includes('MANGA_DER') || clean.includes('SLEEVE_R') || clean.includes('MANGA_DERECHA')) {
    return 'MANGA_DER';
  }
  if (clean.includes('MANGA') || clean.includes('SLEEVE')) {
    return 'MANGA_IZQ'; // Predeterminado para mangas no especificadas
  }
  if (clean.includes('SHORT_FRENTE')) {
    return 'SHORT_FRENTE';
  }
  if (clean.includes('SHORT_ESPALDA') || clean.includes('SHORT_TRASERO')) {
    return 'SHORT_ESPALDA';
  }
  if (clean.includes('PANTALONETA_I') || clean.includes('PANTALONETA_IZQ') || clean.includes('SHORT_I') || clean.includes('SHORT_IZQ') || clean.includes('SHORT_F')) {
    return 'PANTALONETA_IZQ';
  }
  if (clean.includes('PANTALONETA_D') || clean.includes('PANTALONETA_DER') || clean.includes('SHORT_D') || clean.includes('SHORT_DER') || clean.includes('SHORT_E') || clean.includes('SHORT_A')) {
    return 'PANTALONETA_DER';
  }
  if (clean.includes('PANTALONETA') || clean.includes('SHORT')) {
    return 'PANTALONETA_IZQ';
  }
  if (clean.includes('CUELLO') || clean.includes('COLLAR') || clean.includes('RIB')) {
    return 'CUELLO';
  }

  return null;
}

/**
 * Expresión regular para extraer la talla de un identificador (ej. "T28", "TALLA_30", "SZ_S", "M")
 */
function detectSizeName(identifier: string): string | null {
  const clean = identifier.toUpperCase();

  // Patrón 1: T28, TALLA28, T_28, TALLA_30
  const matchNum = clean.match(/(?:TALLA|T|SZ)[-_]?(\d+)/i);
  if (matchNum) {
    return matchNum[1];
  }

  // Patrón 2: Talla alfanumérica al inicio o entre delimitadores: T_S, TALLA_M, T_XL, TS_
  const matchAlpha = clean.match(/(?:TALLA|T|SZ)[-_]?(XXL|XL|XS|S|M|L)(?:[-_]|\b)/i);
  if (matchAlpha) {
    return matchAlpha[1];
  }

  // Patrón 3: Si contiene delimitadores (ej. "28_DELANTERO" o "M_ESPALDA")
  const matchDirect = clean.match(/\b(\d+|XXL|XL|XS|S|M|L)[-_]/i);
  if (matchDirect) {
    return normalizeSizeName(matchDirect[1]);
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
    if (matrixMatch) {
      x = parseFloat(matrixMatch[5]) || 0;
      y = parseFloat(matrixMatch[6]) || 0;
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
    const originalId = idMatch ? idMatch[1] : `path_${elementIndex}`;

    // Extraer polígono y métricas en milímetros reales
    const cutPolygon = parseSvgPathToPolygon(d, viewport);
    if (cutPolygon.length < 3) continue; // Descartar trazados degenerados

    const bbox = computeBoundingBox(cutPolygon);
    const areaMm2 = calculatePolygonArea(cutPolygon);

    // Descartar trazados insignificantes o líneas guía internas (ej. líneas de escote o piquetes)
    if (areaMm2 < 8000 || bbox.width < 60 || bbox.height < 60) continue;

    // Intentar clasificar automáticamente talla y tipo de pieza
    let detectedSize = detectSizeName(originalId);
    let detectedType = detectPieceType(originalId);

    // Si no se detectó talla por el ID, buscar si hay una etiqueta de texto dentro o cerca del bbox de la pieza
    if (!detectedSize) {
      for (const lbl of textLabels) {
        if (
          lbl.x >= bbox.minX - 25 &&
          lbl.x <= bbox.maxX + 25 &&
          lbl.y >= bbox.minY - 25 &&
          lbl.y <= bbox.maxY + 25
        ) {
          const matchSize = detectSizeName(lbl.text) || (lbl.text.match(/^\d{2}$/) ? lbl.text : null);
          if (matchSize) {
            detectedSize = normalizeSizeName(matchSize);
            break;
          }
        }
      }
    }

    // Heurística geométrica para clasificar el tipo de pieza si no viene en el ID:
    if (!detectedType) {
      if (bbox.width > bbox.height * 1.15 && bbox.height < 450) {
        // Manga: típicamente más ancha que alta
        detectedType = 'MANGA_IZQ';
      } else if (bbox.height >= 450) {
        // Torso: delantero o espalda (se refinará en post-procesamiento por área)
        const existingForSize = sizeMap[detectedSize || ''] || [];
        const hasDelantero = existingForSize.some((p) => p.pieceType.includes('DELANTERO'));
        detectedType = hasDelantero ? 'ESPALDA' : 'DELANTERO';
      } else if (bbox.height >= 250 && bbox.width >= 250) {
        // Short / Pantaloneta
        const existingForSize = sizeMap[detectedSize || ''] || [];
        const hasShortIzq = existingForSize.some((p) => p.pieceType === 'PANTALONETA_IZQ' || p.pieceType === 'SHORT_FRENTE');
        detectedType = hasShortIzq ? 'PANTALONETA_DER' : 'PANTALONETA_IZQ';
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
    const torsoPieces = piecesInSize.filter((p) => p.bbox.height >= 450);

    if (torsoPieces.length === 3) {
      // 3 piezas de torso en la misma talla:
      // 1. Mayor área física: ESPALDA (escote alto cerrado conserva mayor superficie)
      // 2. Área media: DELANTERO CUELLO REDONDO
      // 3. Menor área física: DELANTERO CUELLO EN V (el escote en V cala más profundo y resta tela)
      torsoPieces.sort((a, b) => b.areaMm2 - a.areaMm2);

      torsoPieces[0].pieceType = 'ESPALDA';
      torsoPieces[0].pieceName = `T${sizeName}_ESPALDA`;
      torsoPieces[0].allowedRotationsDeg = getDefaultRotationsForPieceType('ESPALDA');

      torsoPieces[1].pieceType = 'DELANTERO_REDONDO';
      torsoPieces[1].pieceName = `T${sizeName}_DELANTERO_REDONDO`;
      torsoPieces[1].allowedRotationsDeg = getDefaultRotationsForPieceType('DELANTERO_REDONDO');

      torsoPieces[2].pieceType = 'DELANTERO_V';
      torsoPieces[2].pieceName = `T${sizeName}_DELANTERO_V`;
      torsoPieces[2].allowedRotationsDeg = getDefaultRotationsForPieceType('DELANTERO_V');
    } else if (torsoPieces.length === 2) {
      torsoPieces.sort((a, b) => b.areaMm2 - a.areaMm2);
      torsoPieces[0].pieceType = 'ESPALDA';
      torsoPieces[0].pieceName = `T${sizeName}_ESPALDA`;
      torsoPieces[0].allowedRotationsDeg = getDefaultRotationsForPieceType('ESPALDA');

      if (!torsoPieces[1].pieceType || torsoPieces[1].pieceType === 'ESPALDA') {
        torsoPieces[1].pieceType = 'DELANTERO';
        torsoPieces[1].pieceName = `T${sizeName}_DELANTERO`;
        torsoPieces[1].allowedRotationsDeg = getDefaultRotationsForPieceType('DELANTERO');
      }
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
