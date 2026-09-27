import { 
  PatternSet, 
  PatternSize, 
  PatternPiece, 
  PieceType, 
  SvgParseResult 
} from './types';
import { extractSvgViewport, parseSvgPathToPolygon } from '@/core/svg/svgPathParser';
import { computeBoundingBox, calculatePolygonArea } from '@/core/geometry/transform';
import { normalizeSizeName } from '@/modules/orders/orderValidator';

/**
 * Expresión regular para clasificar el tipo de pieza a partir de su identificador
 */
function detectPieceType(identifier: string): PieceType | null {
  const clean = identifier.toUpperCase();

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
  if (clean.includes('SHORT_F') || clean.includes('SHORT_FRENTE') || clean.includes('PANTALONETA_F')) {
    return 'SHORT_FRENTE';
  }
  if (clean.includes('SHORT_A') || clean.includes('SHORT_E') || clean.includes('SHORT_ESPALDA') || clean.includes('SHORT_TRASERO')) {
    return 'SHORT_ESPALDA';
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

  // Patrón 2: Talla alfanumérica al inicio o entre delimitadores: T_S, TALLA_M, T_XL
  const matchAlpha = clean.match(/(?:TALLA|T|SZ)[-_]?(XXL|XL|XS|S|M|L)\b/i);
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
    case 'ESPALDA':
      return [0]; // Estricto: 0° únicamente (diseño frontal o dorsal vertical)
    case 'MANGA_IZQ':
    case 'MANGA_DER':
    case 'SHORT_FRENTE':
    case 'SHORT_ESPALDA':
      return [0, 180]; // Permite giro de 180° si la trama del diseño lo admite
    case 'CUELLO':
      return [0, 90, 180, 270]; // Rotación libre para piezas pequeñas de rib
    default:
      return [0];
  }
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

    // Intentar clasificar automáticamente talla y tipo de pieza
    const detectedSize = detectSizeName(originalId);
    const detectedType = detectPieceType(originalId);

    const isAutoAssigned = Boolean(detectedSize && detectedType);
    const sizeName = detectedSize || 'SIN_TALLA';
    const pieceType: PieceType = detectedType || 'OTRO';
    const allowedRotationsDeg = getDefaultRotationsForPieceType(pieceType);

    const piece: PatternPiece = {
      id: `piece_${originalId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sizeName,
      pieceType,
      pieceName: originalId,
      cutPolygon,
      bbox,
      areaMm2,
      allowedRotationsDeg,
      svgPathData: d,
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
