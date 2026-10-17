import {
  NestingPieceInput,
  PlacedNestingPiece,
  NestingOptions,
  NestingResult,
  NestingSheet,
} from './types';
import { getOrientedPolygon, computeBoundingBox, doPolygonsOverlap } from '../geometry/transform';
import { Point2D } from '../geometry/types';
import { minimumPolygonDistance, getPiecePolygon } from './placementValidation';

const DEFAULT_PRINTABLE_WIDTH_MM = 1120.0;
const DEFAULT_MAX_SHEET_LENGTH_MM = 5000.0; // 5.0 metros
const DEFAULT_SPACING_MM = 3.0; // Separación compacta de 3 mm
const DEFAULT_SIDE_MARGIN_MM = 3.0; // Margen lateral de 3 mm
const DEFAULT_TOP_MARGIN_MM = 4.0; // Margen superior/inferior de 4 mm

interface SegmentProfile {
  getYAtX(x: number): { minY: number; maxY: number };
}

const segmentProfileCache = new WeakMap<Point2D[], SegmentProfile>();
const polygonBoundsCache = new WeakMap<Point2D[], ReturnType<typeof computeBoundingBox>>();

function getCachedPolygonBounds(poly: Point2D[]): ReturnType<typeof computeBoundingBox> {
  const cached = polygonBoundsCache.get(poly);
  if (cached) return cached;
  const bounds = computeBoundingBox(poly);
  polygonBoundsCache.set(poly, bounds);
  return bounds;
}

function getPolygonSegmentProfiles(poly: Point2D[]): SegmentProfile {
  const cached = segmentProfileCache.get(poly);
  if (cached) return cached;
  const segments: { p1: Point2D; p2: Point2D; minX: number; maxX: number }[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % n];
    segments.push({
      p1,
      p2,
      minX: Math.min(p1.x, p2.x),
      maxX: Math.max(p1.x, p2.x),
    });
  }

  const bounds = getCachedPolygonBounds(poly);
  const bucketSize = 8;
  const bucketCount = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / bucketSize) + 1);
  const buckets = Array.from({ length: bucketCount }, () => [] as typeof segments);
  for (const segment of segments) {
    const firstBucket = Math.max(0, Math.floor((segment.minX - bounds.minX) / bucketSize));
    const lastBucket = Math.min(bucketCount - 1, Math.floor((segment.maxX - bounds.minX) / bucketSize));
    for (let bucket = firstBucket; bucket <= lastBucket; bucket++) {
      buckets[bucket].push(segment);
    }
  }

  const profile: SegmentProfile = {
    getYAtX(x: number): { minY: number; maxY: number } {
      let minY = Infinity;
      let maxY = -Infinity;
      const bucketIndex = Math.max(
        0,
        Math.min(bucketCount - 1, Math.floor((x - bounds.minX) / bucketSize))
      );
      for (const seg of buckets[bucketIndex]) {
        if (x >= seg.minX && x <= seg.maxX) {
          if (Math.abs(seg.p2.x - seg.p1.x) < 0.0001) {
            minY = Math.min(minY, seg.p1.y, seg.p2.y);
            maxY = Math.max(maxY, seg.p1.y, seg.p2.y);
          } else {
            const t = (x - seg.p1.x) / (seg.p2.x - seg.p1.x);
            const y = seg.p1.y + t * (seg.p2.y - seg.p1.y);
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return { minY, maxY };
    },
  };
  segmentProfileCache.set(poly, profile);
  return profile;
}

function computeMinNonCollidingY(
  poly1: Point2D[],
  poly2Base: Point2D[],
  candidateX2: number,
  spacingMm: number
): number {
  if (!poly1 || poly1.length < 3 || !poly2Base || poly2Base.length < 3) {
    const bbox1 = getCachedPolygonBounds(poly1 || []);
    return bbox1.maxY + spacingMm;
  }

  const poly2AtCandidateX = Math.abs(candidateX2) < 0.0001
    ? poly2Base
    : poly2Base.map((p) => ({ x: p.x + candidateX2, y: p.y }));
  const prof1 = getPolygonSegmentProfiles(poly1);
  const prof2 = getPolygonSegmentProfiles(poly2AtCandidateX);

  const bbox1 = getCachedPolygonBounds(poly1);
  const bbox2 = getCachedPolygonBounds(poly2AtCandidateX);

  const overlapMinX = Math.max(bbox1.minX, bbox2.minX);
  const overlapMaxX = Math.min(bbox1.maxX, bbox2.maxX);

  if (overlapMinX > overlapMaxX) {
    return bbox1.minY;
  }

  let maxReqY = -Infinity;
  // En polígonos lineales el máximo de separación vertical cambia en los
  // vértices. Evaluarlos evita un muestreo cada 2 mm mucho más costoso.
  const sampleXs = new Set<number>([overlapMinX, overlapMaxX]);
  for (const point of poly1) {
    if (point.x >= overlapMinX && point.x <= overlapMaxX) sampleXs.add(point.x);
  }
  for (const point of poly2AtCandidateX) {
    if (point.x >= overlapMinX && point.x <= overlapMaxX) sampleXs.add(point.x);
  }
  for (const x of sampleXs) {
    const y1 = prof1.getYAtX(x).maxY;
    const y2 = prof2.getYAtX(x).minY;
    if (Number.isFinite(y1) && Number.isFinite(y2)) {
      const reqY = y1 - y2 + spacingMm;
      if (reqY > maxReqY) maxReqY = reqY;
    }
  }

  return Number.isFinite(maxReqY) ? maxReqY : bbox1.maxY + spacingMm;
}

function refineGroupYForEuclideanSpacing(
  previousPolygons: Point2D[][],
  localGroupPolygons: Point2D[][],
  initialY: number,
  spacingMm: number
): number {
  let refinedY = initialY;
  for (let iteration = 0; iteration < 12; iteration++) {
    let maximumDeficit = 0;
    for (const previous of previousPolygons) {
      for (const local of localGroupPolygons) {
        const shifted = local.map((point) => ({ x: point.x, y: point.y + refinedY }));
        if (!haveHorizontalContactRange(previous, shifted, spacingMm)) continue;
        const distance = minimumPolygonDistance(previous, shifted);
        maximumDeficit = Math.max(maximumDeficit, spacingMm - distance);
      }
    }
    if (maximumDeficit <= 0.01) break;
    refinedY += Math.max(0.1, maximumDeficit * 1.25);
  }
  return refinedY;
}

/**
 * Calcula la coordenada X mínima segura para colocar una pieza en un intervalo vertical [yStart, yEnd],
 * garantizando que respete la separación física (spacingMm) respecto a cualquier pieza ya ubicada.
 */
function getMinSafeXForYRange(
  placedPieces: PlacedNestingPiece[],
  yStart: number,
  yEnd: number,
  spacingMm: number,
  fallbackX: number
): number {
  let minSafeX = fallbackX;
  for (const p of placedPieces) {
    if (p.yMm < yEnd && (p.yMm + p.effectiveHeightMm) > yStart) {
      const pRight = p.xMm + p.effectiveWidthMm + spacingMm;
      if (pRight > minSafeX) {
        minSafeX = pRight;
      }
    }
  }
  return Number(minSafeX.toFixed(2));
}

function isSleevePiece(piece: NestingPieceInput): boolean {
  return piece.pieceType.toUpperCase().startsWith('MANGA');
}

function getPlacedPiecePolygon(piece: PlacedNestingPiece): Point2D[] {
  if (piece.cutPolygon && piece.cutPolygon.length >= 3) {
    return getOrientedPolygon(piece.cutPolygon, piece.rotationDeg, piece.xMm, piece.yMm);
  }

  return [
    { x: piece.xMm, y: piece.yMm },
    { x: piece.xMm + piece.effectiveWidthMm, y: piece.yMm },
    { x: piece.xMm + piece.effectiveWidthMm, y: piece.yMm + piece.effectiveHeightMm },
    { x: piece.xMm, y: piece.yMm + piece.effectiveHeightMm },
  ];
}

function haveHorizontalContactRange(polyA: Point2D[], polyB: Point2D[], spacingMm: number): boolean {
  const boxA = getCachedPolygonBounds(polyA);
  const boxB = getCachedPolygonBounds(polyB);
  return boxA.minX < boxB.maxX + spacingMm && boxA.maxX + spacingMm > boxB.minX;
}

/**
 * Desplaza un grupo rígido hacia abajo hasta que sus polígonos queden separados
 * de todas las mangas anteriores. Los AABB pueden superponerse: manda la silueta.
 */
function computeMinGroupYBelowPolygons(
  previousPolygons: Point2D[][],
  localGroupPolygons: Point2D[][],
  spacingMm: number,
  minimumY: number
): number {
  let requiredY = minimumY;

  for (const previous of previousPolygons) {
    for (const localPolygon of localGroupPolygons) {
      if (!haveHorizontalContactRange(previous, localPolygon, spacingMm)) continue;
      requiredY = Math.max(
        requiredY,
        computeMinNonCollidingY(previous, localPolygon, 0, spacingMm)
      );
    }
  }

  return requiredY;
}

/**
 * Conserva el grupo a la derecha de cuerpos/cuellos. Si al subirlo invade el
 * AABB de una pieza no-manga, lo baja solo hasta superar esa pieza.
 */
function moveGroupBelowBlockingPieces(
  localGroupPolygons: Point2D[][],
  initialY: number,
  blockingPieces: PlacedNestingPiece[],
  spacingMm: number
): number {
  const localBoxes = localGroupPolygons.map(computeBoundingBox);
  let groupY = initialY;

  for (let iteration = 0; iteration <= blockingPieces.length; iteration++) {
    let nextY = groupY;

    for (const blocker of blockingPieces) {
      const blockerLeft = blocker.xMm;
      const blockerRight = blocker.xMm + blocker.effectiveWidthMm;
      const blockerTop = blocker.yMm;
      const blockerBottom = blocker.yMm + blocker.effectiveHeightMm;

      for (const localBox of localBoxes) {
        const overlapsX = localBox.minX < blockerRight + spacingMm
          && localBox.maxX + spacingMm > blockerLeft;
        if (!overlapsX) continue;

        const candidateTop = groupY + localBox.minY;
        const candidateBottom = groupY + localBox.maxY;
        const overlapsY = candidateTop < blockerBottom + spacingMm
          && candidateBottom + spacingMm > blockerTop;

        if (overlapsY) {
          nextY = Math.max(nextY, blockerBottom + spacingMm - localBox.minY);
        }
      }
    }

    if (nextY <= groupY + 0.0001) break;
    groupY = nextY;
  }

  return groupY;
}

interface PlayerGarmentSet {
  orderItemId: string;
  playerName: string;
  playerNumber: string;
  sizeName: string;
  delantero?: NestingPieceInput;
  espalda?: NestingPieceInput;
  mangaIzq?: NestingPieceInput;
  mangaDer?: NestingPieceInput;
  cuello?: NestingPieceInput;
  otherPieces: NestingPieceInput[];
}

interface PlayerShortSet {
  orderItemId: string;
  playerName: string;
  playerNumber: string;
  sizeName: string;
  pantaIzq?: NestingPieceInput;
  pantaDer?: NestingPieceInput;
  otherPieces: NestingPieceInput[];
}

interface PlacedItemPlan {
  piece: NestingPieceInput;
  x: number;
  relY: number;
  w: number;
  h: number;
  rotationDeg: number;
}

/**
 * Motor de Nesting Modular Industrial Continuo.
 * - Estructura el acomodo en columnas independientes continuas sin huecos negros:
 *   - Columna 1: Delanteros apilados verticalmente con separación mínima (6mm).
 *   - Columna 2: Espaldas apiladas verticalmente con separación mínima (6mm).
 *   - Columna 3 (y N-columnas en rollos anchos): Mangas rotadas 90° en flujo vertical continuo pegadas a la derecha.
 *   - Espacios residuales y base: Cuellos y ribetes empacados compactamente.
 * - Estructura los shorts en pares continuos [Pierna Izq + Pierna Der] lado a lado.
 * - Separa Camisetas de Shorts en pliegos/archivos independientes.
 * - Particiona automáticamente en pliegos de máximo 500 cm (o el largo configurado).
 */
export function performModularNesting(
  pieces: NestingPieceInput[],
  customOptions?: Partial<NestingOptions>
): NestingResult {
  const startTime = performance.now();

  const printableWidthMm = customOptions?.printableWidthMm ?? DEFAULT_PRINTABLE_WIDTH_MM;
  const maxSheetLengthMm = customOptions?.maxSheetLengthMm ?? DEFAULT_MAX_SHEET_LENGTH_MM;
  const spacingMm = customOptions?.spacingMm ?? DEFAULT_SPACING_MM;
  const sideMarginMm = customOptions?.sideMarginMm ?? DEFAULT_SIDE_MARGIN_MM;
  const topMarginMm = customOptions?.topMarginMm ?? DEFAULT_TOP_MARGIN_MM;

  // 1. Clasificar piezas
  const camisetaPlayerList: PlayerGarmentSet[] = [];
  const shortPlayerList: PlayerShortSet[] = [];
  const camisetaMap = new Map<string, PlayerGarmentSet>();
  const shortMap = new Map<string, PlayerShortSet>();

  for (const piece of pieces) {
    const key = piece.orderItemId || `${piece.playerName}_${piece.playerNumber}_${piece.sizeName}`;
    const pType = piece.pieceType.toUpperCase();

    const isShort = pType.startsWith('SHORT') || pType.startsWith('PANTALONETA');
    const isCamiseta = pType.startsWith('DELANTERO') || pType.startsWith('ESPALDA') || pType.startsWith('MANGA') || pType.startsWith('CUELLO');

    if (isShort) {
      if (!shortMap.has(key)) {
        const newSet: PlayerShortSet = {
          orderItemId: piece.orderItemId,
          playerName: piece.playerName,
          playerNumber: piece.playerNumber,
          sizeName: piece.sizeName,
          otherPieces: [],
        };
        shortMap.set(key, newSet);
        shortPlayerList.push(newSet);
      }
      const set = shortMap.get(key)!;
      if (pType === 'PANTALONETA_IZQ' || pType === 'SHORT_FRENTE') set.pantaIzq = piece;
      else if (pType === 'PANTALONETA_DER' || pType === 'SHORT_ESPALDA') set.pantaDer = piece;
      else set.otherPieces.push(piece);
    } else if (isCamiseta) {
      if (!camisetaMap.has(key)) {
        const newSet: PlayerGarmentSet = {
          orderItemId: piece.orderItemId,
          playerName: piece.playerName,
          playerNumber: piece.playerNumber,
          sizeName: piece.sizeName,
          otherPieces: [],
        };
        camisetaMap.set(key, newSet);
        camisetaPlayerList.push(newSet);
      }
      const set = camisetaMap.get(key)!;
      if (pType.startsWith('DELANTERO')) set.delantero = piece;
      else if (pType === 'ESPALDA') set.espalda = piece;
      else if (pType === 'MANGA_IZQ' || pType === 'MANGA_I') set.mangaIzq = piece;
      else if (pType === 'MANGA_DER' || pType === 'MANGA_D') set.mangaDer = piece;
      else if (pType === 'CUELLO') set.cuello = piece;
      else if (pType.startsWith('MANGA')) {
        if (!set.mangaIzq) set.mangaIzq = piece;
        else if (!set.mangaDer) set.mangaDer = piece;
        else set.otherPieces.push(piece);
      }
      else set.otherPieces.push(piece);
    }
  }

  const sheets: NestingSheet[] = [];
  const allPlacedPieces: PlacedNestingPiece[] = [];
  let sheetCounter = 1;

  const createNewSheet = (garmentType: 'CAMISETA' | 'SHORT' | 'ALL'): NestingSheet => {
    const num = sheetCounter++;
    const typeTitle = garmentType === 'CAMISETA' ? 'Camisetas' : garmentType === 'SHORT' ? 'Shorts' : 'General';
    const sheet: NestingSheet = {
      id: `sheet_${num}_${garmentType.toLowerCase()}`,
      sheetNumber: num,
      garmentType,
      title: `PARTE ${num} — ${typeTitle}`,
      fileName: `PARTE_${num}_${garmentType}_${printableWidthMm.toFixed(0)}mm`,
      widthMm: printableWidthMm,
      heightMm: topMarginMm,
      maxHeightMm: maxSheetLengthMm,
      placedPieces: [],
      totalPiecesAreaMm2: 0,
      usedAreaMm2: 0,
      utilizationPercent: 0,
      wastePercent: 0,
      playerNames: [],
    };
    sheets.push(sheet);
    return sheet;
  };

  // ==========================================
  // 2. ACOMODO CONTINUO INDUSTRIAL DE CAMISETAS
  // ==========================================
  if (camisetaPlayerList.length > 0) {
    /**
     * Fase 2 por pliego: Evaluador Multi-Variante (Variantes 1, 2 y 3) para la zona inferior
     * bajo las camisetas para mangas excedentes + empaquetado de cuellos a todo lo ancho.
     */
    const planSheetAccessories = (
      jerseyBottomY: number,
      sleevesToPlace: NestingPieceInput[],
      collarsToPlace: NestingPieceInput[],
      sheetIdx: number
    ): { placedAccessories: PlacedNestingPiece[]; bottomY: number; heightMm: number } => {
      const placedAccessories: PlacedNestingPiece[] = [];
      const remainingSleeves: NestingPieceInput[] = [...sleevesToPlace];
      const remainingCollars: NestingPieceInput[] = [];

      let bottomY = jerseyBottomY;

      if (remainingSleeves.length > 0) {
        const baseStartY = jerseyBottomY;

        // --- VARIANTE 1: Horizontal (0° / 180°) en filas a todo lo ancho ---
        const evalVariant1 = (): { pieces: PlacedNestingPiece[]; bottomY: number } => {
          const pieces: PlacedNestingPiece[] = [];
          let currY = baseStartY;
          let currX = sideMarginMm;
          let rowH = 0;
          let rotToggle = 0;

          for (const sleeve of remainingSleeves) {
            const sW = sleeve.bbox.width;
            const sH = sleeve.bbox.height;

            if (currX > sideMarginMm && currX + sW + sideMarginMm > printableWidthMm) {
              currY += rowH + spacingMm;
              currX = sideMarginMm;
              rowH = 0;
            }

            pieces.push({
              ...sleeve,
              xMm: Number(currX.toFixed(2)),
              yMm: Number(currY.toFixed(2)),
              rotationDeg: rotToggle,
              effectiveWidthMm: sW,
              effectiveHeightMm: sH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            rotToggle = rotToggle === 0 ? 180 : 0;
            currX += sW + spacingMm;
            rowH = Math.max(rowH, sH);
          }

          if (rowH > 0) {
            currY += rowH + spacingMm;
          }
          return { pieces, bottomY: currY };
        };

        // --- VARIANTE 2: Vertical (90° / 270°) Multi-Columna a todo lo ancho ---
        const evalVariant2 = (): { pieces: PlacedNestingPiece[]; bottomY: number } => {
          const pieces: PlacedNestingPiece[] = [];
          let currY = baseStartY;
          let currX = sideMarginMm;
          let rowH = 0;
          let rotToggle = 90;

          for (const sleeve of remainingSleeves) {
            const sW = sleeve.bbox.height;
            const sH = sleeve.bbox.width;

            if (currX > sideMarginMm && currX + sW + sideMarginMm > printableWidthMm) {
              currY += rowH + spacingMm;
              currX = sideMarginMm;
              rowH = 0;
            }

            pieces.push({
              ...sleeve,
              xMm: Number(currX.toFixed(2)),
              yMm: Number(currY.toFixed(2)),
              rotationDeg: rotToggle,
              effectiveWidthMm: sW,
              effectiveHeightMm: sH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            rotToggle = rotToggle === 90 ? 270 : 90;
            currX += sW + spacingMm;
            rowH = Math.max(rowH, sH);
          }

          if (rowH > 0) {
            currY += rowH + spacingMm;
          }
          return { pieces, bottomY: currY };
        };

        // --- VARIANTE 3: Emparejamiento por bloques de 2 mangas (Tête-bêche / espejo) ---
        const evalVariant3 = (): { pieces: PlacedNestingPiece[]; bottomY: number } => {
          const pieces: PlacedNestingPiece[] = [];
          let currY = baseStartY;
          let currX = sideMarginMm;
          let rowH = 0;

          let i = 0;
          while (i < remainingSleeves.length) {
            const m1 = remainingSleeves[i];
            const m2 = i + 1 < remainingSleeves.length ? remainingSleeves[i + 1] : undefined;

            if (m2) {
              const pairW = m1.bbox.height + spacingMm + m2.bbox.height;
              const pairH = Math.max(m1.bbox.width, m2.bbox.width);

              if (currX > sideMarginMm && currX + pairW + sideMarginMm > printableWidthMm) {
                currY += rowH + spacingMm;
                currX = sideMarginMm;
                rowH = 0;
              }

              pieces.push(
                {
                  ...m1,
                  xMm: Number(currX.toFixed(2)),
                  yMm: Number(currY.toFixed(2)),
                  rotationDeg: 90,
                  effectiveWidthMm: m1.bbox.height,
                  effectiveHeightMm: m1.bbox.width,
                  isLocked: false,
                  sheetIndex: sheetIdx,
                },
                {
                  ...m2,
                  xMm: Number((currX + m1.bbox.height + spacingMm).toFixed(2)),
                  yMm: Number(currY.toFixed(2)),
                  rotationDeg: 270,
                  effectiveWidthMm: m2.bbox.height,
                  effectiveHeightMm: m2.bbox.width,
                  isLocked: false,
                  sheetIndex: sheetIdx,
                }
              );

              currX += pairW + spacingMm;
              rowH = Math.max(rowH, pairH);
              i += 2;
            } else {
              const sW = m1.bbox.height;
              const sH = m1.bbox.width;

              if (currX > sideMarginMm && currX + sW + sideMarginMm > printableWidthMm) {
                currY += rowH + spacingMm;
                currX = sideMarginMm;
                rowH = 0;
              }

              pieces.push({
                ...m1,
                xMm: Number(currX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 90,
                effectiveWidthMm: sW,
                effectiveHeightMm: sH,
                isLocked: false,
                sheetIndex: sheetIdx,
              });

              currX += sW + spacingMm;
              rowH = Math.max(rowH, sH);
              i += 1;
            }
          }

          if (rowH > 0) {
            currY += rowH + spacingMm;
          }
          return { pieces, bottomY: currY };
        };

        const v1 = evalVariant1();
        const v2 = evalVariant2();
        const v3 = evalVariant3();

        // Selección automática de la variante con menor bottomY (mayor aprovechamiento de papel)
        let bestVariant = v1;
        for (const candidate of [v2, v3]) {
          if (candidate.bottomY < bestVariant.bottomY - 0.01) {
            bestVariant = candidate;
          }
        }

        placedAccessories.push(...bestVariant.pieces);
        bottomY = bestVariant.bottomY;
      }

      // Cuellos y piezas adicionales: empacar en la zona inferior a todo lo ancho
      for (const collar of collarsToPlace) {
        remainingCollars.push(collar);
      }

      let collarX = sideMarginMm;
      let collarRowH = 0;
      for (const collar of remainingCollars) {
        const cW = collar.bbox.width;
        const cH = collar.bbox.height;

        if (collarX + cW + sideMarginMm > printableWidthMm) {
          bottomY += collarRowH + spacingMm;
          collarX = sideMarginMm;
          collarRowH = 0;
        }

        placedAccessories.push({
          ...collar,
          xMm: Number(collarX.toFixed(2)),
          yMm: Number(bottomY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: cW,
          effectiveHeightMm: cH,
          isLocked: false,
          sheetIndex: sheetIdx,
        });

        collarX += cW + spacingMm;
        collarRowH = Math.max(collarRowH, cH);
      }
      if (collarRowH > 0) {
        bottomY += collarRowH + spacingMm;
      }

      const heightMm = Number((bottomY + topMarginMm).toFixed(2));
      return { placedAccessories, bottomY, heightMm };
    };

    interface SheetLayoutPlan {
      placedPieces: PlacedNestingPiece[];
      totalHeightMm: number;
      playerNames: string[];
    }

    /**
     * Planifica y acomoda un bloque de camisetas para un pliego:
     * - Camisetas (Delantero y Espalda) en filas a la izquierda con separación mínima (spacingMm).
     * - Pista Vertical Continua Desacoplada: Mangas apiladas continuamente a la derecha
     *   (Manga 1 en topMargin, Manga 2 inmediatamente debajo, Manga 3 debajo, etc.)
     *   sin detenerse por la altura de la camiseta contigua, hasta jerseyBottomY.
     * - Cuellos residuales en cualquier espacio libre lateral.
     * - Mangas sobrantes y cuellos restantes en la base del pliego evaluados multi-variante.
     */
    /**
     * Planifica y acomoda un bloque de camisetas para un pliego con Aprovechamiento Máximo:
     * 1. Cada fila junta Delantero y Espalda del mismo jugador a la izquierda con solo spacingMm (2 mm).
     * 2. Se calcula el ancho libre real a la derecha DE ESA FILA: availableRightW = printableWidthMm - (espX + wEsp + spacing) - sideMargin.
     * 3. Si caben 2 mangas en paralelo (ej. Ailanny, Thiago, tallas infantiles/juveniles):
     *    se colocan las 2 mangas inmediatamente al lado de la espalda en 2 columnas (cero hueco blanco!).
     * 4. Si cabe 1 manga: se coloca pegada a la espalda, y cualquier espacio vertical debajo de ella
     *    se aprovecha con cuellos o piezas adicionales de inmediato.
     * 5. Cualquier manga o cuello que no quepa en los laterales se acumula para la base del pliego (evaluador multi-variante).
     */
    const layoutCamisetaSheet = (
      sheetPlayers: PlayerGarmentSet[],
      sheetIdx: number
    ): SheetLayoutPlan => {
      const placedPieces: PlacedNestingPiece[] = [];
      const playerNames: string[] = [];
      // Cola global: las mangas de jugadores posteriores pueden ocupar huecos
      // libres de filas anteriores. El vínculo por jugador no bloquea el nesting.
      const leftoverSleeves: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
        ...(set.mangaIzq ? [set.mangaIzq] : []),
        ...(set.mangaDer ? [set.mangaDer] : []),
      ]);
      const leftoverCollars: NestingPieceInput[] = [];

      let jerseyY = topMarginMm;
      let continuousCol1Y = topMarginMm;
      let continuousCol2Y = topMarginMm;
      let singleColumnAnchorX: number | null = null;

      // Proyectar todos los cuerpos antes de ubicar mangas. Así una manga nunca
      // ocupa un hueco que será invadido después por una talla más ancha.
      const projectedBodyPieces: PlacedNestingPiece[] = [];
      let projectedJerseyY = topMarginMm;
      for (const projectedSet of sheetPlayers) {
        const projectedDel = projectedSet.delantero;
        const projectedEsp = projectedSet.espalda;
        const projectedWDel = projectedDel?.bbox.width ?? 0;
        const projectedHDel = projectedDel?.bbox.height ?? 0;
        const projectedWEsp = projectedEsp?.bbox.width ?? 0;
        const projectedHEsp = projectedEsp?.bbox.height ?? 0;
        const projectedPairWidth = sideMarginMm + projectedWDel
          + (projectedDel && projectedEsp ? spacingMm : 0)
          + projectedWEsp + sideMarginMm;

        if ((projectedDel && projectedEsp && projectedPairWidth <= printableWidthMm)
          || (projectedDel && !projectedEsp)
          || (!projectedDel && projectedEsp)) {
          const projectedDelX = sideMarginMm;
          if (projectedDel) {
            projectedBodyPieces.push({
              ...projectedDel,
              xMm: projectedDelX,
              yMm: projectedJerseyY,
              rotationDeg: 0,
              effectiveWidthMm: projectedWDel,
              effectiveHeightMm: projectedHDel,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
          }
          if (projectedEsp) {
            projectedBodyPieces.push({
              ...projectedEsp,
              xMm: projectedDelX + projectedWDel + (projectedDel ? spacingMm : 0),
              yMm: projectedJerseyY,
              rotationDeg: 0,
              effectiveWidthMm: projectedWEsp,
              effectiveHeightMm: projectedHEsp,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
          }
          projectedJerseyY += Math.max(projectedHDel, projectedHEsp) + spacingMm;
        } else {
          if (projectedDel) {
            projectedBodyPieces.push({
              ...projectedDel,
              xMm: sideMarginMm,
              yMm: projectedJerseyY,
              rotationDeg: 0,
              effectiveWidthMm: projectedWDel,
              effectiveHeightMm: projectedHDel,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            projectedJerseyY += projectedHDel + spacingMm;
          }
          if (projectedEsp) {
            projectedBodyPieces.push({
              ...projectedEsp,
              xMm: sideMarginMm,
              yMm: projectedJerseyY,
              rotationDeg: 0,
              effectiveWidthMm: projectedWEsp,
              effectiveHeightMm: projectedHEsp,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            projectedJerseyY += projectedHEsp + spacingMm;
          }
        }
      }
      const projectedBodyBottomY = projectedJerseyY;

      const tryPlaceSingleSleeveInRow = (candidates: NestingPieceInput[], rowRightEdge: number): boolean => {
        let bestIndex = -1;
        let bestX = Infinity;
        let bestY = Infinity;
        let bestBottom = Infinity;
        let bestArea = -Infinity;
        let bestRotation = 90;
        const previousSleevePolygons = placedPieces
          .filter(isSleevePiece)
          .map(getPlacedPiecePolygon);
        const previousSleeveBoxes = previousSleevePolygons.map(computeBoundingBox);
        const projectedBodyLaneStart = projectedBodyPieces.length > 0
          ? Math.min(...projectedBodyPieces.map(
              (piece) => piece.xMm + piece.effectiveWidthMm + spacingMm
            ))
          : sideMarginMm;

        for (let index = 0; index < candidates.length; index++) {
          const sleeve = candidates[index];
          const sleeveWidth = sleeve.bbox.height;
          const sleeveHeight = sleeve.bbox.width;
          const minScanX = Math.max(
            sideMarginMm,
            Math.min(rowRightEdge, projectedBodyLaneStart)
          );
          const maxScanX = printableWidthMm - sideMarginMm - sleeveWidth;
          if (minScanX > maxScanX + 0.01) continue;

          const scanOffsets = new Set<number>();
          const addScanOffset = (x: number): void => {
            const clamped = Math.max(minScanX, Math.min(maxScanX, x));
            scanOffsets.add(Number(clamped.toFixed(2)));
          };
          addScanOffset(minScanX);
          addScanOffset(maxScanX);
          addScanOffset(rowRightEdge);
          if (singleColumnAnchorX !== null) addScanOffset(singleColumnAnchorX);
          for (const body of projectedBodyPieces) {
            addScanOffset(body.xMm + body.effectiveWidthMm + spacingMm);
          }
          for (const box of previousSleeveBoxes) {
            addScanOffset(box.minX);
            addScanOffset(box.maxX - sleeveWidth);
          }

          const preferredRotation = sleeve.pieceType.toUpperCase().includes('DER') ? 270 : 90;
          const rotations = preferredRotation === 90 ? [90, 270] : [270, 90];
          for (const rotation of rotations) {
            let foundCandidateForRotation = false;
            for (const candidateX of scanOffsets) {
              const localPolygon = (sleeve.cutPolygon && sleeve.cutPolygon.length >= 3)
                ? getOrientedPolygon(sleeve.cutPolygon, rotation, candidateX, 0)
                : [
                    { x: candidateX, y: 0 },
                    { x: candidateX + sleeveWidth, y: 0 },
                    { x: candidateX + sleeveWidth, y: sleeveHeight },
                    { x: candidateX, y: sleeveHeight },
                  ];
              let candidateY = computeMinGroupYBelowPolygons(
                previousSleevePolygons,
                [localPolygon],
                spacingMm,
                topMarginMm
              );
              candidateY = moveGroupBelowBlockingPieces(
                [localPolygon],
                candidateY,
                projectedBodyPieces,
                spacingMm
              );
              const candidateBottom = candidateY + sleeveHeight;
              if (candidateBottom > projectedBodyBottomY + 0.01) continue;
              foundCandidateForRotation = true;

              const area = sleeve.areaMm2 || sleeve.bbox.width * sleeve.bbox.height;
              if (candidateBottom < bestBottom - 0.01
                || (Math.abs(candidateBottom - bestBottom) <= 0.01 && candidateY < bestY - 0.01)
                || (Math.abs(candidateBottom - bestBottom) <= 0.01
                  && Math.abs(candidateY - bestY) <= 0.01
                  && area > bestArea)) {
                bestIndex = index;
                bestX = candidateX;
                bestY = candidateY;
                bestBottom = candidateBottom;
                bestArea = area;
                bestRotation = rotation;
              }
            }
            if (foundCandidateForRotation) break;
          }
        }

        if (bestIndex < 0) return false;

        const sleeve = candidates[bestIndex];
        const sleeveWidth = sleeve.bbox.height;
        const sleeveHeight = sleeve.bbox.width;
        const bestLocalPolygon = (sleeve.cutPolygon && sleeve.cutPolygon.length >= 3)
          ? getOrientedPolygon(sleeve.cutPolygon, bestRotation, bestX, 0)
          : [
              { x: bestX, y: 0 },
              { x: bestX + sleeveWidth, y: 0 },
              { x: bestX + sleeveWidth, y: sleeveHeight },
              { x: bestX, y: sleeveHeight },
            ];
        bestY = refineGroupYForEuclideanSpacing(
          previousSleevePolygons,
          [bestLocalPolygon],
          bestY,
          spacingMm
        );
        bestY = moveGroupBelowBlockingPieces(
          [bestLocalPolygon],
          bestY,
          projectedBodyPieces,
          spacingMm
        );
        if (bestY + sleeveHeight > projectedBodyBottomY + 0.01) return false;
        placedPieces.push({
          ...sleeve,
          xMm: Number(bestX.toFixed(2)),
          yMm: Number(bestY.toFixed(2)),
          rotationDeg: bestRotation,
          effectiveWidthMm: sleeveWidth,
          effectiveHeightMm: sleeveHeight,
          isLocked: false,
          sheetIndex: sheetIdx,
        });

        singleColumnAnchorX = bestX;
        continuousCol1Y = Math.max(continuousCol1Y, bestY + sleeveHeight + spacingMm);
        candidates.splice(bestIndex, 1);
        return true;
      };

      const placeSleevesInCorridor = (candidates: NestingPieceInput[], rowRightEdge: number): void => {
        if (candidates.length === 0) return;

        // 1. Probar doble columna evaluando el ancho REAL disponible en la Y de colocación de las mangas
        let canFitDoubleCol = false;
        if (candidates.length >= 2) {
          const sW1 = candidates[0].bbox.height;
          const sH1 = candidates[0].bbox.width;
          const sW2 = candidates[1].bbox.height;
          const requiredDoubleWidth = sW1 + spacingMm + sW2;
          const realStartX = getMinSafeXForYRange(
            [...projectedBodyPieces, ...placedPieces.filter(isSleevePiece)],
            continuousCol1Y,
            continuousCol1Y + sH1,
            spacingMm,
            sideMarginMm
          );
          const realAvailableWidth = printableWidthMm - realStartX - sideMarginMm;
          if (realAvailableWidth >= requiredDoubleWidth) {
            canFitDoubleCol = true;
          }
        }

        if (canFitDoubleCol) {
          // DOBLE COLUMNA CONTINUA (Para bobinas anchas como 1600mm / 1800mm o tallas infantiles)
          while (candidates.length >= 2) {
            const sm1 = candidates[0];
            const sm2 = candidates[1];
            const sW1 = sm1.bbox.height;
            const sH1 = sm1.bbox.width;
            const sW2 = sm2.bbox.height;
            const sH2 = sm2.bbox.width;

            const safeCol1X = getMinSafeXForYRange(
              [...projectedBodyPieces, ...placedPieces.filter(isSleevePiece)],
              continuousCol1Y,
              continuousCol1Y + sH1,
              spacingMm,
              sideMarginMm
            );
            const col1X = Number(safeCol1X.toFixed(2));
            const col2X = Number((col1X + sW1 + spacingMm).toFixed(2));

            if (col2X + sW2 > printableWidthMm - sideMarginMm) break;
            if (Math.max(continuousCol1Y + sH1, continuousCol2Y + sH2) > projectedBodyBottomY + 0.01) break;

            placedPieces.push(
              {
                ...sm1,
                xMm: col1X,
                yMm: Number(continuousCol1Y.toFixed(2)),
                rotationDeg: 90,
                effectiveWidthMm: sW1,
                effectiveHeightMm: sH1,
                isLocked: false,
                sheetIndex: sheetIdx,
              },
              {
                ...sm2,
                xMm: col2X,
                yMm: Number(continuousCol2Y.toFixed(2)),
                rotationDeg: 90,
                effectiveWidthMm: sW2,
                effectiveHeightMm: sH2,
                isLocked: false,
                sheetIndex: sheetIdx,
              }
            );

            continuousCol1Y += sH1 + spacingMm;
            continuousCol2Y += sH2 + spacingMm;
            candidates.splice(0, 2);
          }
          return;
        }

        // 2. Probar mangas de forma HORIZONTAL si el ancho libre a la derecha lo permite
        // (Para tallas adultas en bobina 1120 mm donde el cuerpo deja ~510 mm libres y la manga mide ~500 mm)
        let placedHorizontal = false;
        while (candidates.length > 0) {
          const sm = candidates[0];
          const sW = sm.bbox.width;
          const sH = sm.bbox.height;
          const realStartX = getMinSafeXForYRange(
            [...projectedBodyPieces, ...placedPieces.filter(isSleevePiece)],
            continuousCol1Y,
            continuousCol1Y + sH,
            spacingMm,
            sideMarginMm
          );
          const realAvailableWidth = printableWidthMm - realStartX - sideMarginMm;
          if (realAvailableWidth >= sW && sW > sH * 1.25) {
            if (continuousCol1Y + sH > projectedBodyBottomY + 0.01) break;
            const rot = sm.pieceType.toUpperCase().includes('DER') ? 180 : 0;
            placedPieces.push({
              ...sm,
              xMm: Number(realStartX.toFixed(2)),
              yMm: Number(continuousCol1Y.toFixed(2)),
              rotationDeg: rot,
              effectiveWidthMm: sW,
              effectiveHeightMm: sH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            continuousCol1Y += sH + spacingMm;
            continuousCol2Y = continuousCol1Y;
            candidates.splice(0, 1);
            placedHorizontal = true;
          } else {
            break;
          }
        }
        if (placedHorizontal && candidates.length === 0) return;

        // 3. COLUMNA VERTICAL ÚNICA TÊTE-BÊCHE (Para bobina 1120 mm)
        while (candidates.length >= 2) {
          const sm1 = candidates[0];
          const sm2 = candidates[1];

          const rot1 = 90;
          const rot2 = 270;
          const w1 = sm1.bbox.height;
          const h1 = sm1.bbox.width;
          const w2 = sm2.bbox.height;
          const h2 = sm2.bbox.width;

          const blockingPieces = projectedBodyPieces;
          const hasOrganicContours = (sm1.cutPolygon?.length ?? 0) > 4
            || (sm2.cutPolygon?.length ?? 0) > 4;

          const safeXAtCursor = getMinSafeXForYRange(
            blockingPieces,
            continuousCol1Y,
            continuousCol1Y + h1,
            spacingMm,
            sideMarginMm
          );
          const maxX1 = printableWidthMm - Math.max(w1, w2) - sideMarginMm;
          if (maxX1 < sideMarginMm) break;
          const x1: number = Number(Math.max(
            sideMarginMm,
            Math.min(singleColumnAnchorX ?? safeXAtCursor, maxX1)
          ).toFixed(2));

          if (!hasOrganicContours) {
            const y1 = Number(continuousCol1Y.toFixed(2));
            const y2 = Number((y1 + h1 + spacingMm).toFixed(2));
            const x2 = getMinSafeXForYRange(
              blockingPieces,
              y2,
              y2 + h2,
              spacingMm,
              x1
            );
            if (x2 + w2 > printableWidthMm - sideMarginMm) break;
            if (y2 + h2 > projectedBodyBottomY + 0.01) break;

            placedPieces.push(
              {
                ...sm1,
                xMm: x1,
                yMm: y1,
                rotationDeg: rot1,
                effectiveWidthMm: w1,
                effectiveHeightMm: h1,
                isLocked: false,
                sheetIndex: sheetIdx,
              },
              {
                ...sm2,
                xMm: x2,
                yMm: y2,
                rotationDeg: rot2,
                effectiveWidthMm: w2,
                effectiveHeightMm: h2,
                isLocked: false,
                sheetIndex: sheetIdx,
              }
            );
            singleColumnAnchorX = x1;
            continuousCol1Y = y2 + h2 + spacingMm;
            candidates.splice(0, 2);
            continue;
          }

          const previousSleevePolygons = placedPieces
            .filter(isSleevePiece)
            .map(getPlacedPiecePolygon);
          const contactSleevePolygons = previousSleevePolygons.slice(-2);

          const poly1Local = (sm1.cutPolygon && sm1.cutPolygon.length >= 3)
            ? getOrientedPolygon(sm1.cutPolygon, rot1, x1, 0)
            : [{ x: x1, y: 0 }, { x: x1 + w1, y: 0 }, { x: x1 + w1, y: h1 }, { x: x1, y: h1 }];

          const minScanX = Math.max(sideMarginMm, x1 - 100);
          const maxScanX = printableWidthMm - w2 - sideMarginMm;
          if (minScanX > maxScanX) break;

          const scanOffsets = new Set<number>();
          scanOffsets.add(x1);
          scanOffsets.add(Math.min(maxScanX, Math.max(minScanX, x1 + w1 - w2)));
          scanOffsets.add(Math.min(maxScanX, Math.max(minScanX, x1 + Math.round((w1 - w2) / 2))));

          for (let sx = minScanX; sx <= maxScanX; sx += 8) {
            scanOffsets.add(Number(sx.toFixed(2)));
          }

          let bestX2 = x1;
          let bestY1 = Infinity;
          let bestY2 = Infinity;
          let bestBottomY = Infinity;
          let bestLocalY2 = Infinity;

          const evaluateX2 = (candX2: number): void => {
            if (candX2 + w2 > printableWidthMm - sideMarginMm) return;

            const poly2AtZero = (sm2.cutPolygon && sm2.cutPolygon.length >= 3)
              ? getOrientedPolygon(sm2.cutPolygon, rot2, candX2, 0)
              : [{ x: candX2, y: 0 }, { x: candX2 + w2, y: 0 }, { x: candX2 + w2, y: h2 }, { x: candX2, y: h2 }];

            const localY2 = Math.max(
              computeMinNonCollidingY(poly1Local, poly2AtZero, 0, spacingMm),
              spacingMm
            );
            const poly2Local = poly2AtZero.map((point) => ({
              x: point.x,
              y: point.y + localY2,
            }));
            const localPair = [poly1Local, poly2Local];

            let pairY = hasOrganicContours
              ? computeMinGroupYBelowPolygons(
                  contactSleevePolygons,
                  localPair,
                  spacingMm,
                  topMarginMm
                )
                  : continuousCol1Y;
            if (hasOrganicContours) {
              pairY = moveGroupBelowBlockingPieces(
                localPair,
                pairY,
                blockingPieces,
                spacingMm
              );
            }

            const candY1 = Number(pairY.toFixed(2));
            const candY2 = Number((pairY + localY2).toFixed(2));
            const bottomY = Math.max(candY1 + h1, candY2 + h2);
            if (bottomY < bestBottomY) {
              bestBottomY = bottomY;
              bestX2 = candX2;
              bestY1 = candY1;
              bestY2 = candY2;
              bestLocalY2 = localY2;
            }
          };

          for (const candX2 of scanOffsets) {
            evaluateX2(candX2);
          }

          if (Number.isFinite(bestBottomY)) {
            const coarseBestX2 = bestX2;
            for (let sx = coarseBestX2 - 8; sx <= coarseBestX2 + 8; sx += 1) {
              if (sx < minScanX || sx > maxScanX) continue;
              evaluateX2(Number(sx.toFixed(2)));
            }
          }

          if (!Number.isFinite(bestBottomY)) break;

          if (hasOrganicContours) {
            const bestPoly2AtZero = (sm2.cutPolygon && sm2.cutPolygon.length >= 3)
              ? getOrientedPolygon(sm2.cutPolygon, rot2, bestX2, 0)
              : [{ x: bestX2, y: 0 }, { x: bestX2 + w2, y: 0 }, { x: bestX2 + w2, y: h2 }, { x: bestX2, y: h2 }];
            bestLocalY2 = refineGroupYForEuclideanSpacing(
              [poly1Local],
              [bestPoly2AtZero],
              bestLocalY2,
              spacingMm
            );
            const bestPoly2Local = bestPoly2AtZero.map((point) => ({
              x: point.x,
              y: point.y + bestLocalY2,
            }));
            const bestLocalPair = [poly1Local, bestPoly2Local];
            let finalPairY = computeMinGroupYBelowPolygons(
              previousSleevePolygons,
              bestLocalPair,
              spacingMm,
              topMarginMm
            );
            finalPairY = refineGroupYForEuclideanSpacing(
              previousSleevePolygons,
              bestLocalPair,
              finalPairY,
              spacingMm
            );
            finalPairY = moveGroupBelowBlockingPieces(
              bestLocalPair,
              finalPairY,
              blockingPieces,
              spacingMm
            );
            bestY1 = Number(finalPairY.toFixed(2));
            bestY2 = Number((finalPairY + bestLocalY2).toFixed(2));
            bestBottomY = Math.max(bestY1 + h1, bestY2 + h2);
          }

          if (bestBottomY > projectedBodyBottomY + 0.01) break;

          placedPieces.push({
            ...sm1,
            xMm: x1,
            yMm: bestY1,
            rotationDeg: rot1,
            effectiveWidthMm: w1,
            effectiveHeightMm: h1,
            isLocked: false,
            sheetIndex: sheetIdx,
          });

          placedPieces.push({
            ...sm2,
            xMm: bestX2,
            yMm: bestY2,
            rotationDeg: rot2,
            effectiveWidthMm: w2,
            effectiveHeightMm: h2,
            isLocked: false,
            sheetIndex: sheetIdx,
          });

          singleColumnAnchorX = x1;
          continuousCol1Y = bestBottomY + spacingMm;
          candidates.splice(0, 2);
        }

        // 4. Si ninguna variante de pareja resolvió todo el conjunto, intentar una manga en el hueco
        while (candidates.length > 0 && tryPlaceSingleSleeveInRow(candidates, rowRightEdge)) {
        }
      };

      for (const playerSet of sheetPlayers) {
        if (!playerNames.includes(playerSet.playerName)) {
          playerNames.push(playerSet.playerName);
        }

        const del = playerSet.delantero;
        const esp = playerSet.espalda;
        const cuello = playerSet.cuello;

        const wDel = del ? del.bbox.width : 0;
        const hDel = del ? del.bbox.height : 0;
        const wEsp = esp ? esp.bbox.width : 0;
        const hEsp = esp ? esp.bbox.height : 0;
        const jerseyRowH = Math.max(hDel, hEsp);

        const pairWidth = sideMarginMm + wDel + (del && esp ? spacingMm : 0) + wEsp + sideMarginMm;
        const canFitBothInRow = del && esp && pairWidth <= printableWidthMm;

        const rowCollars: NestingPieceInput[] = [];
        if (cuello) rowCollars.push(cuello);
        for (const o of playerSet.otherPieces) rowCollars.push(o);

        if (canFitBothInRow || (del && !esp) || (!del && esp)) {
          // --- Fila con Delantero y Espalda lado a lado ---
          const delX = sideMarginMm;
          if (del) {
            placedPieces.push({
              ...del,
              xMm: delX,
              yMm: Number(jerseyY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: wDel,
              effectiveHeightMm: hDel,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
          }

          const espX = del ? Number((delX + wDel + spacingMm).toFixed(2)) : sideMarginMm;
          if (esp) {
            placedPieces.push({
              ...esp,
              xMm: espX,
              yMm: Number(jerseyY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: wEsp,
              effectiveHeightMm: hEsp,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
          }

          const rowRightEdge = (esp ? espX + wEsp : delX + wDel) + spacingMm;
          const availableRightWidth = printableWidthMm - rowRightEdge - sideMarginMm;
          const candidatesToPlace = [...leftoverSleeves];
          leftoverSleeves.length = 0;

          const collarsToPlace = [...rowCollars, ...leftoverCollars];
          leftoverCollars.length = 0;

          const minSleeveDimension = candidatesToPlace.length > 0
            ? Math.min(...candidatesToPlace.map((c) => Math.min(c.bbox.width, c.bbox.height)))
            : 150;

          if (availableRightWidth >= minSleeveDimension) {
            placeSleevesInCorridor(candidatesToPlace, rowRightEdge);
          }

          // Si sobran mangas que no cupieron en esta fila, guardar para siguientes filas o la base
          leftoverSleeves.push(...candidatesToPlace);
          leftoverCollars.push(...collarsToPlace);

          jerseyY += jerseyRowH + spacingMm;
        } else {
          // --- Tallas adultas extra grandes que no caben juntas en ancho ---
          // Delantero y Espalda se apilan en la columna izquierda a X = sideMarginMm
          const playerStartY = jerseyY;
          if (del) {
            placedPieces.push({
              ...del,
              xMm: sideMarginMm,
              yMm: Number(jerseyY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: wDel,
              effectiveHeightMm: hDel,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            jerseyY += hDel + spacingMm;
          }

          if (esp) {
            placedPieces.push({
              ...esp,
              xMm: sideMarginMm,
              yMm: Number(jerseyY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: wEsp,
              effectiveHeightMm: hEsp,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            jerseyY += hEsp + spacingMm;
          }

          const playerBottomY = jerseyY;
          const maxBodyW = Math.max(wDel, wEsp);
          const rowRightEdge = sideMarginMm + maxBodyW + spacingMm;

          const candidatesToPlace = [...leftoverSleeves];
          leftoverSleeves.length = 0;

          const safeAtContinuous = getMinSafeXForYRange(
            placedPieces,
            continuousCol1Y,
            continuousCol1Y + 50,
            spacingMm,
            rowRightEdge
          );
          let sleeveCurrY = (safeAtContinuous > rowRightEdge + 1)
            ? Math.max(continuousCol1Y, playerStartY)
            : continuousCol1Y;
          let sleeveToggle = 90;

          while (candidatesToPlace.length > 0) {
            const sm = candidatesToPlace[0];
            const sW = sm.bbox.height;
            const sH = sm.bbox.width;

            const safeX = getMinSafeXForYRange(
              placedPieces,
              sleeveCurrY,
              sleeveCurrY + sH,
              spacingMm,
              rowRightEdge
            );
            const currentAvailableW = printableWidthMm - safeX - sideMarginMm;

            // 1. ¿Caben 2 mangas en paralelo en el ancho libre a la derecha?
            if (
              candidatesToPlace.length >= 2 &&
              currentAvailableW >= sW * 2 + spacingMm &&
              sleeveCurrY + sH <= playerBottomY + 0.5
            ) {
              const sm2 = candidatesToPlace[1];
              const sW2 = sm2.bbox.height;
              const sH2 = sm2.bbox.width;
              placedPieces.push(
                {
                  ...sm,
                  xMm: safeX,
                  yMm: Number(sleeveCurrY.toFixed(2)),
                  rotationDeg: 90,
                  effectiveWidthMm: sW,
                  effectiveHeightMm: sH,
                  isLocked: false,
                  sheetIndex: sheetIdx,
                },
                {
                  ...sm2,
                  xMm: Number((safeX + sW + spacingMm).toFixed(2)),
                  yMm: Number(sleeveCurrY.toFixed(2)),
                  rotationDeg: 90,
                  effectiveWidthMm: sW2,
                  effectiveHeightMm: sH2,
                  isLocked: false,
                  sheetIndex: sheetIdx,
                }
              );
              sleeveCurrY += Math.max(sH, sH2) + spacingMm;
              candidatesToPlace.splice(0, 2);
              continue;
            }

            // 2. Columna única pegada al cuerpo a partir de safeX
            if (sW > currentAvailableW) break;
            if (sleeveCurrY + sH > playerBottomY + 0.5) break;

            placedPieces.push({
              ...sm,
              xMm: safeX,
              yMm: Number(sleeveCurrY.toFixed(2)),
              rotationDeg: sleeveToggle,
              effectiveWidthMm: sW,
              effectiveHeightMm: sH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            sleeveCurrY += sH + spacingMm;
            sleeveToggle = sleeveToggle === 90 ? 270 : 90;
            candidatesToPlace.splice(0, 1);
          }

          continuousCol1Y = sleeveCurrY;
          continuousCol2Y = sleeveCurrY;
          leftoverSleeves.push(...candidatesToPlace);

          if (cuello) leftoverCollars.push(cuello);
          for (const o of playerSet.otherPieces) leftoverCollars.push(o);
        }
      }

      const jerseyBottomY = Math.max(jerseyY, continuousCol1Y, continuousCol2Y);

      // Acomodo de mangas sobrantes y cuellos en la zona inferior bajo las camisetas
      const plan = planSheetAccessories(
        jerseyBottomY,
        leftoverSleeves,
        leftoverCollars,
        sheetIdx
      );

      placedPieces.push(...plan.placedAccessories);
      const totalHeightMm = plan.heightMm;

      return {
        placedPieces,
        totalHeightMm,
        playerNames,
      };
    };

    /**
     * Planificador Multicolumna Dinámico para Bobinas Anchas (> 1200 mm, ej. 1600, 1800, 1900 mm).
     * Evalúa automáticamente múltiples variantes competitivas:
     * - Variante W1: Emparejamiento Multi-Cuerpo (4 o 3 cuerpos por fila) + Mangas Laterales
     * - Variante W2: 2 Cuerpos Lado a Lado + K Columnas Continuas de Mangas en Paralelo (K >= 2, 3, 4)
     * - Variante W3: Shelf-Packing Combinado de Cuerpos (Empaquetado dinámico por fila con mangas)
     * Selecciona deterministamente la variante que logre el menor largo total y mayor aprovechamiento.
     */
    const layoutWideCamisetaSheet = (
      sheetPlayers: PlayerGarmentSet[],
      sheetIdx: number
    ): SheetLayoutPlan => {
      const standardPlan = layoutCamisetaSheet(sheetPlayers, sheetIdx);
      if (sheetPlayers.length === 0 || printableWidthMm <= 1200) {
        return standardPlan;
      }

      const playerNames = Array.from(new Set(sheetPlayers.map((p) => p.playerName)));

      let expectedPiecesCount = 0;
      for (const p of sheetPlayers) {
        if (p.delantero) expectedPiecesCount++;
        if (p.espalda) expectedPiecesCount++;
        if (p.mangaIzq) expectedPiecesCount++;
        if (p.mangaDer) expectedPiecesCount++;
        if (p.cuello) expectedPiecesCount++;
        expectedPiecesCount += p.otherPieces.length;
      }

      const candidatePlans: SheetLayoutPlan[] = [standardPlan];

      // Helper reutilizable: Aprovecha el hueco libre a la derecha de cualquier fila de cuerpos
      // colocando columnas paralelas de mangas (90°/270°) y cuellos en el espacio libre.
      const fillRowGapWithAccessories = (
        placedPieces: PlacedNestingPiece[],
        currX: number,
        currY: number,
        rowH: number,
        allSleeves: NestingPieceInput[],
        sleeveIdxRef: { value: number },
        allCollars: NestingPieceInput[],
        collarIdxRef: { value: number }
      ) => {
        const freeW = printableWidthMm - currX - sideMarginMm;
        if (freeW < 50) return;

        const remainingSleeves = allSleeves.slice(sleeveIdxRef.value);
        const minSleeveW = remainingSleeves.length > 0
          ? Math.min(...remainingSleeves.map((s) => Math.min(s.bbox.width, s.bbox.height)))
          : 180;

        const numSleeveCols = Math.floor((freeW + spacingMm) / (minSleeveW + spacingMm));

        if (numSleeveCols >= 1 && remainingSleeves.length > 0) {
          const colW = (freeW - (numSleeveCols - 1) * spacingMm) / numSleeveCols;
          const colXs: number[] = [];
          const colYs: number[] = [];
          for (let c = 0; c < numSleeveCols; c++) {
            colXs.push(Number((currX + c * (colW + spacingMm)).toFixed(2)));
            colYs.push(currY);
          }

          while (sleeveIdxRef.value < allSleeves.length) {
            let bestC = 0;
            for (let c = 1; c < numSleeveCols; c++) {
              if (colYs[c] < colYs[bestC]) bestC = c;
            }

            const sm = allSleeves[sleeveIdxRef.value];
            const sW = Math.min(sm.bbox.width, sm.bbox.height);
            const sH = Math.max(sm.bbox.width, sm.bbox.height);

            if (colXs[bestC] + sW > printableWidthMm - sideMarginMm + 0.01) break;
            if (colYs[bestC] + sH > currY + rowH + spacingMm + 0.01) break;

            const rot = (bestC % 2 === 0)
              ? (colYs[bestC] === currY ? 90 : 270)
              : (colYs[bestC] === currY ? 270 : 90);

            placedPieces.push({
              ...sm,
              xMm: colXs[bestC],
              yMm: Number(colYs[bestC].toFixed(2)),
              rotationDeg: rot,
              effectiveWidthMm: sW,
              effectiveHeightMm: sH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            colYs[bestC] += sH + spacingMm;
            sleeveIdxRef.value++;
          }

          // Llenar cualquier espacio vertical sobrante bajo las mangas con cuellos
          while (collarIdxRef.value < allCollars.length) {
            let bestC = 0;
            for (let c = 1; c < numSleeveCols; c++) {
              if (colYs[c] < colYs[bestC]) bestC = c;
            }

            const col = allCollars[collarIdxRef.value];
            const cW = col.bbox.width;
            const cH = col.bbox.height;

            if (colXs[bestC] + cW > printableWidthMm - sideMarginMm + 0.01) break;
            if (colYs[bestC] + cH > currY + rowH + spacingMm + 0.01) break;

            placedPieces.push({
              ...col,
              xMm: colXs[bestC],
              yMm: Number(colYs[bestC].toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: cW,
              effectiveHeightMm: cH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            colYs[bestC] += cH + spacingMm;
            collarIdxRef.value++;
          }
        } else {
          // Si no caben mangas o ya se ubicaron todas, llenar el ancho libre con cuellos
          let cX = currX;
          let cY = currY;
          let colRowH = 0;
          while (collarIdxRef.value < allCollars.length) {
            const col = allCollars[collarIdxRef.value];
            const cW = col.bbox.width;
            const cH = col.bbox.height;

            if (cX > currX && cX + cW + sideMarginMm > printableWidthMm) {
              cY += colRowH + spacingMm;
              cX = currX;
              colRowH = 0;
            }

            if (cY + cH > currY + rowH + spacingMm + 0.01) break;

            placedPieces.push({
              ...col,
              xMm: Number(cX.toFixed(2)),
              yMm: Number(cY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: cW,
              effectiveHeightMm: cH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            cX += cW + spacingMm;
            colRowH = Math.max(colRowH, cH);
            collarIdxRef.value++;
          }
        }
      };

      // -------------------------------------------------------------
      // VARIANTE W1: Multi-Cuerpo Horizontal por Jugadores (4 cuerpos o 2 cuerpos) + Multi-Columna Lateral
      // -------------------------------------------------------------
      const runVariantW1 = (): SheetLayoutPlan | null => {
        const placedPieces: PlacedNestingPiece[] = [];
        const allSleeves: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.mangaIzq ? [set.mangaIzq] : []),
          ...(set.mangaDer ? [set.mangaDer] : []),
        ]);
        const allCollars: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.cuello ? [set.cuello] : []),
          ...set.otherPieces,
        ]);

        let currY = topMarginMm;
        const sleeveIdxRef = { value: 0 };
        const collarIdxRef = { value: 0 };
        let i = 0;

        while (i < sheetPlayers.length) {
          const p1 = sheetPlayers[i];
          const p2 = i + 1 < sheetPlayers.length ? sheetPlayers[i + 1] : undefined;

          const wDel1 = p1.delantero?.bbox.width ?? 0;
          const hDel1 = p1.delantero?.bbox.height ?? 0;
          const wEsp1 = p1.espalda?.bbox.width ?? 0;
          const hEsp1 = p1.espalda?.bbox.height ?? 0;

          const wDel2 = p2?.delantero?.bbox.width ?? 0;
          const hDel2 = p2?.delantero?.bbox.height ?? 0;
          const wEsp2 = p2?.espalda?.bbox.width ?? 0;
          const hEsp2 = p2?.espalda?.bbox.height ?? 0;

          const fourBodiesWidth = sideMarginMm
            + wDel1 + (p1.delantero && p1.espalda ? spacingMm : 0) + wEsp1
            + (p2?.delantero ? spacingMm + wDel2 : 0)
            + (p2?.espalda ? spacingMm + wEsp2 : 0)
            + sideMarginMm;

          if (p2 && fourBodiesWidth <= printableWidthMm) {
            let curX = sideMarginMm;
            const rowH = Math.max(hDel1, hEsp1, hDel2, hEsp2);

            if (p1.delantero) {
              placedPieces.push({
                ...p1.delantero,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wDel1,
                effectiveHeightMm: hDel1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wDel1 + spacingMm;
            }
            if (p1.espalda) {
              placedPieces.push({
                ...p1.espalda,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wEsp1,
                effectiveHeightMm: hEsp1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wEsp1 + spacingMm;
            }
            if (p2.delantero) {
              placedPieces.push({
                ...p2.delantero,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wDel2,
                effectiveHeightMm: hDel2,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wDel2 + spacingMm;
            }
            if (p2.espalda) {
              placedPieces.push({
                ...p2.espalda,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wEsp2,
                effectiveHeightMm: hEsp2,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wEsp2 + spacingMm;
            }

            fillRowGapWithAccessories(
              placedPieces,
              curX,
              currY,
              rowH,
              allSleeves,
              sleeveIdxRef,
              allCollars,
              collarIdxRef
            );

            currY += rowH + spacingMm;
            i += 2;
          } else {
            let curX = sideMarginMm;
            const rowH = Math.max(hDel1, hEsp1);

            if (p1.delantero) {
              placedPieces.push({
                ...p1.delantero,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wDel1,
                effectiveHeightMm: hDel1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wDel1 + spacingMm;
            }
            if (p1.espalda) {
              placedPieces.push({
                ...p1.espalda,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wEsp1,
                effectiveHeightMm: hEsp1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wEsp1 + spacingMm;
            }

            fillRowGapWithAccessories(
              placedPieces,
              curX,
              currY,
              rowH,
              allSleeves,
              sleeveIdxRef,
              allCollars,
              collarIdxRef
            );

            currY += rowH + spacingMm;
            i += 1;
          }
        }

        const remainingSleeves = allSleeves.slice(sleeveIdxRef.value);
        const remainingCollars = allCollars.slice(collarIdxRef.value);
        const accPlan = planSheetAccessories(currY, remainingSleeves, remainingCollars, sheetIdx);
        placedPieces.push(...accPlan.placedAccessories);

        return {
          placedPieces,
          totalHeightMm: accPlan.heightMm,
          playerNames,
        };
      };

      // -------------------------------------------------------------
      // VARIANTE W2: 2 Cuerpos Lado a Lado + K Columnas Continuas de Mangas en Paralelo
      // -------------------------------------------------------------
      const runVariantW2 = (): SheetLayoutPlan | null => {
        const placedPieces: PlacedNestingPiece[] = [];
        const allSleeves: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.mangaIzq ? [set.mangaIzq] : []),
          ...(set.mangaDer ? [set.mangaDer] : []),
        ]);
        const allCollars: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.cuello ? [set.cuello] : []),
          ...set.otherPieces,
        ]);

        let jerseyY = topMarginMm;
        let maxBodyRight = 0;

        for (const p of sheetPlayers) {
          const wDel = p.delantero?.bbox.width ?? 0;
          const hDel = p.delantero?.bbox.height ?? 0;
          const wEsp = p.espalda?.bbox.width ?? 0;
          const hEsp = p.espalda?.bbox.height ?? 0;
          const rowH = Math.max(hDel, hEsp);

          let curX = sideMarginMm;
          if (p.delantero) {
            placedPieces.push({
              ...p.delantero,
              xMm: curX,
              yMm: Number(jerseyY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: wDel,
              effectiveHeightMm: hDel,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            curX += wDel + spacingMm;
          }
          if (p.espalda) {
            placedPieces.push({
              ...p.espalda,
              xMm: curX,
              yMm: Number(jerseyY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: wEsp,
              effectiveHeightMm: hEsp,
              isLocked: false,
              sheetIndex: sheetIdx,
            });
            curX += wEsp + spacingMm;
          }

          maxBodyRight = Math.max(maxBodyRight, curX);
          jerseyY += rowH + spacingMm;
        }

        const availableRightWidth = printableWidthMm - maxBodyRight - sideMarginMm;
        const minSleeveW = allSleeves.length > 0
          ? Math.min(...allSleeves.map((s) => Math.min(s.bbox.width, s.bbox.height)))
          : 180;
        const numCols = Math.max(1, Math.floor((availableRightWidth + spacingMm) / (minSleeveW + spacingMm)));

        const colXs: number[] = [];
        const colYs: number[] = [];
        const colW = (availableRightWidth - (numCols - 1) * spacingMm) / numCols;
        for (let c = 0; c < numCols; c++) {
          colXs.push(Number((maxBodyRight + c * (colW + spacingMm)).toFixed(2)));
          colYs.push(topMarginMm);
        }

        let sleeveIdx = 0;
        while (sleeveIdx < allSleeves.length) {
          let bestC = 0;
          for (let c = 1; c < numCols; c++) {
            if (colYs[c] < colYs[bestC]) bestC = c;
          }

          const sm = allSleeves[sleeveIdx];
          const sW = Math.min(sm.bbox.width, sm.bbox.height);
          const sH = Math.max(sm.bbox.width, sm.bbox.height);

          if (colXs[bestC] + sW > printableWidthMm - sideMarginMm) break;

          const rot = (bestC % 2 === 0)
            ? (colYs[bestC] === topMarginMm ? 90 : 270)
            : (colYs[bestC] === topMarginMm ? 270 : 90);

          placedPieces.push({
            ...sm,
            xMm: colXs[bestC],
            yMm: Number(colYs[bestC].toFixed(2)),
            rotationDeg: rot,
            effectiveWidthMm: sW,
            effectiveHeightMm: sH,
            isLocked: false,
            sheetIndex: sheetIdx,
          });

          colYs[bestC] += sH + spacingMm;
          sleeveIdx++;
        }

        const remainingSleeves = allSleeves.slice(sleeveIdx);
        const sleevesBottomY = Math.max(...colYs, topMarginMm);
        const jerseyBottomY = Math.max(jerseyY, sleevesBottomY);

        const accPlan = planSheetAccessories(jerseyBottomY, remainingSleeves, allCollars, sheetIdx);
        placedPieces.push(...accPlan.placedAccessories);

        return {
          placedPieces,
          totalHeightMm: accPlan.heightMm,
          playerNames,
        };
      };

      // -------------------------------------------------------------
      // VARIANTE W3: Dynamic Shelf-Packing de Cuerpos (2, 3 o 4 por fila) + Multi-Columna Lateral
      // -------------------------------------------------------------
      const runVariantW3 = (): SheetLayoutPlan | null => {
        const placedPieces: PlacedNestingPiece[] = [];
        const allBodies: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.delantero ? [set.delantero] : []),
          ...(set.espalda ? [set.espalda] : []),
        ]);
        const allSleeves: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.mangaIzq ? [set.mangaIzq] : []),
          ...(set.mangaDer ? [set.mangaDer] : []),
        ]);
        const allCollars: NestingPieceInput[] = sheetPlayers.flatMap((set) => [
          ...(set.cuello ? [set.cuello] : []),
          ...set.otherPieces,
        ]);

        let currY = topMarginMm;
        let bodyIdx = 0;
        const sleeveIdxRef = { value: 0 };
        const collarIdxRef = { value: 0 };

        while (bodyIdx < allBodies.length) {
          let currX = sideMarginMm;
          let rowH = 0;

          while (bodyIdx < allBodies.length) {
            const body = allBodies[bodyIdx];
            const bW = body.bbox.width;
            const bH = body.bbox.height;

            if (currX > sideMarginMm && currX + bW + sideMarginMm > printableWidthMm) {
              break;
            }

            placedPieces.push({
              ...body,
              xMm: Number(currX.toFixed(2)),
              yMm: Number(currY.toFixed(2)),
              rotationDeg: 0,
              effectiveWidthMm: bW,
              effectiveHeightMm: bH,
              isLocked: false,
              sheetIndex: sheetIdx,
            });

            currX += bW + spacingMm;
            rowH = Math.max(rowH, bH);
            bodyIdx++;
          }

          fillRowGapWithAccessories(
            placedPieces,
            currX,
            currY,
            rowH,
            allSleeves,
            sleeveIdxRef,
            allCollars,
            collarIdxRef
          );

          currY += rowH + spacingMm;
        }

        const remainingSleeves = allSleeves.slice(sleeveIdxRef.value);
        const remainingCollars = allCollars.slice(collarIdxRef.value);
        const accPlan = planSheetAccessories(currY, remainingSleeves, remainingCollars, sheetIdx);
        placedPieces.push(...accPlan.placedAccessories);

        return {
          placedPieces,
          totalHeightMm: accPlan.heightMm,
          playerNames,
        };
      };

      // -------------------------------------------------------------
      // VARIANTE W4: Orden Progresivo por Tallas (Pequeñas a Grandes) en Pares [Del + Esp]
      // -------------------------------------------------------------
      const runVariantW4 = (): SheetLayoutPlan | null => {
        const placedPieces: PlacedNestingPiece[] = [];
        // Ordenar jugadores por talla/altura ascendente (tallas más pequeñas primero, más grandes al final)
        const sortedPlayers = [...sheetPlayers].sort((a, b) => {
          const hA = Math.max(a.delantero?.bbox.height ?? 0, a.espalda?.bbox.height ?? 0);
          const hB = Math.max(b.delantero?.bbox.height ?? 0, b.espalda?.bbox.height ?? 0);
          return hA - hB;
        });

        const allSleeves: NestingPieceInput[] = sortedPlayers.flatMap((set) => [
          ...(set.mangaIzq ? [set.mangaIzq] : []),
          ...(set.mangaDer ? [set.mangaDer] : []),
        ]);
        const allCollars: NestingPieceInput[] = sortedPlayers.flatMap((set) => [
          ...(set.cuello ? [set.cuello] : []),
          ...set.otherPieces,
        ]);

        let currY = topMarginMm;
        const sleeveIdxRef = { value: 0 };
        const collarIdxRef = { value: 0 };
        let i = 0;

        while (i < sortedPlayers.length) {
          const p1 = sortedPlayers[i];
          const p2 = i + 1 < sortedPlayers.length ? sortedPlayers[i + 1] : undefined;

          const wDel1 = p1.delantero?.bbox.width ?? 0;
          const hDel1 = p1.delantero?.bbox.height ?? 0;
          const wEsp1 = p1.espalda?.bbox.width ?? 0;
          const hEsp1 = p1.espalda?.bbox.height ?? 0;

          const wDel2 = p2?.delantero?.bbox.width ?? 0;
          const hDel2 = p2?.delantero?.bbox.height ?? 0;
          const wEsp2 = p2?.espalda?.bbox.width ?? 0;
          const hEsp2 = p2?.espalda?.bbox.height ?? 0;

          const fourBodiesWidth = sideMarginMm
            + wDel1 + (p1.delantero && p1.espalda ? spacingMm : 0) + wEsp1
            + (p2?.delantero ? spacingMm + wDel2 : 0)
            + (p2?.espalda ? spacingMm + wEsp2 : 0)
            + sideMarginMm;

          if (p2 && fourBodiesWidth <= printableWidthMm) {
            let curX = sideMarginMm;
            const rowH = Math.max(hDel1, hEsp1, hDel2, hEsp2);

            if (p1.delantero) {
              placedPieces.push({
                ...p1.delantero,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wDel1,
                effectiveHeightMm: hDel1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wDel1 + spacingMm;
            }
            if (p1.espalda) {
              placedPieces.push({
                ...p1.espalda,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wEsp1,
                effectiveHeightMm: hEsp1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wEsp1 + spacingMm;
            }
            if (p2.delantero) {
              placedPieces.push({
                ...p2.delantero,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wDel2,
                effectiveHeightMm: hDel2,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wDel2 + spacingMm;
            }
            if (p2.espalda) {
              placedPieces.push({
                ...p2.espalda,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wEsp2,
                effectiveHeightMm: hEsp2,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wEsp2 + spacingMm;
            }

            fillRowGapWithAccessories(
              placedPieces,
              curX,
              currY,
              rowH,
              allSleeves,
              sleeveIdxRef,
              allCollars,
              collarIdxRef
            );

            currY += rowH + spacingMm;
            i += 2;
          } else {
            let curX = sideMarginMm;
            const rowH = Math.max(hDel1, hEsp1);

            if (p1.delantero) {
              placedPieces.push({
                ...p1.delantero,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wDel1,
                effectiveHeightMm: hDel1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wDel1 + spacingMm;
            }
            if (p1.espalda) {
              placedPieces.push({
                ...p1.espalda,
                xMm: Number(curX.toFixed(2)),
                yMm: Number(currY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: wEsp1,
                effectiveHeightMm: hEsp1,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              curX += wEsp1 + spacingMm;
            }

            fillRowGapWithAccessories(
              placedPieces,
              curX,
              currY,
              rowH,
              allSleeves,
              sleeveIdxRef,
              allCollars,
              collarIdxRef
            );

            currY += rowH + spacingMm;
            i += 1;
          }
        }

        const remainingSleeves = allSleeves.slice(sleeveIdxRef.value);
        const remainingCollars = allCollars.slice(collarIdxRef.value);
        const accPlan = planSheetAccessories(currY, remainingSleeves, remainingCollars, sheetIdx);
        placedPieces.push(...accPlan.placedAccessories);

        return {
          placedPieces,
          totalHeightMm: accPlan.heightMm,
          playerNames,
        };
      };

      const hasPlanCollision = (plan: SheetLayoutPlan): boolean => {
        const n = plan.placedPieces.length;
        for (let i = 0; i < n; i++) {
          const p1 = plan.placedPieces[i];
          const poly1 = getPiecePolygon(p1);
          const box1 = computeBoundingBox(poly1);
          for (let j = i + 1; j < n; j++) {
            const p2 = plan.placedPieces[j];
            const poly2 = getPiecePolygon(p2);
            const box2 = computeBoundingBox(poly2);
            if (
              box1.minX < box2.maxX &&
              box1.maxX > box2.minX &&
              box1.minY < box2.maxY &&
              box1.maxY > box2.minY
            ) {
              if (doPolygonsOverlap(poly1, poly2)) {
                return true;
              }
            }
          }
        }
        return false;
      };

      const v1 = runVariantW1();
      const v2 = runVariantW2();
      const v3 = runVariantW3();
      const v4 = runVariantW4();

      for (const v of [v1, v2, v3, v4]) {
        if (!v) continue;
        if (v.placedPieces.length !== expectedPiecesCount) continue;
        const inBounds = v.placedPieces.every(
          (p) => p.xMm >= sideMarginMm - 0.01 && p.xMm + p.effectiveWidthMm <= printableWidthMm - sideMarginMm + 0.01
        );
        if (!inBounds) continue;
        if (hasPlanCollision(v)) continue;
        candidatePlans.push(v);
      }

      candidatePlans.sort((a, b) => a.totalHeightMm - b.totalHeightMm);
      return candidatePlans[0];
    };

    /**
     * Dispatcher unificado para pliegos de camisetas:
     * - Bobinas <= 1200 mm (ej. 1120 mm): preserva 100% de manera estricta layoutCamisetaSheet actual.
     * - Bobinas > 1200 mm (ej. 1600, 1800, 1900 mm): ejecuta el planificador multicolumna dinámico competitivo.
     */
    const planCamisetaSheet = (
      sheetPlayers: PlayerGarmentSet[],
      sheetIdx: number
    ): SheetLayoutPlan => {
      if (printableWidthMm <= 1200) {
        return layoutCamisetaSheet(sheetPlayers, sheetIdx);
      }
      return layoutWideCamisetaSheet(sheetPlayers, sheetIdx);
    };

    // Particionado armonioso de pliegos de camisetas
    const playerBatches: PlayerGarmentSet[][] = [];
    let currentBatch: PlayerGarmentSet[] = [];

    for (const player of camisetaPlayerList) {
      if (currentBatch.length === 0) {
        currentBatch.push(player);
      } else {
        const candidate = [...currentBatch, player];
        const est = planCamisetaSheet(candidate, 0);
        if (est.totalHeightMm > maxSheetLengthMm) {
          playerBatches.push(currentBatch);
          currentBatch = [player];
        } else {
          currentBatch = candidate;
        }
      }
    }
    if (currentBatch.length > 0) {
      playerBatches.push(currentBatch);
    }

    for (const batch of playerBatches) {
      const currentSheet = createNewSheet('CAMISETA');
      const plan = planCamisetaSheet(batch, currentSheet.sheetNumber - 1);

      currentSheet.placedPieces.push(...plan.placedPieces);
      allPlacedPieces.push(...plan.placedPieces);
      currentSheet.heightMm = plan.totalHeightMm;
      currentSheet.fileName = `PARTE_${currentSheet.sheetNumber}_CAMISETAS_${printableWidthMm.toFixed(0)}x${currentSheet.heightMm.toFixed(0)}mm`;
      currentSheet.playerNames.push(...plan.playerNames);
    }
  }

  // ==========================================
  // 3. ACOMODO CONTINUO INDUSTRIAL DE SHORTS
  // ==========================================
  if (shortPlayerList.length > 0) {
    let currentSheet = createNewSheet('SHORT');
    let shortRowY = topMarginMm;

    // Helper para rotar puntos poligonales
    const rotatePolyPoints = (poly: Point2D[], deg: number): Point2D[] => {
      if (deg === 0) return poly;
      const rad = (deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return poly.map((pt) => ({
        x: pt.x * cos - pt.y * sin,
        y: pt.x * sin + pt.y * cos,
      }));
    };

    // Helper para calcular el acomodo interlocked entre dos piezas (tiro-con-tiro / parejas)
    interface PairInterlockResult {
      p1: NestingPieceInput;
      rot1: number;
      w1: number;
      h1: number;
      x1Rel: number;
      y1Rel: number;
      p2: NestingPieceInput;
      rot2: number;
      w2: number;
      h2: number;
      x2Rel: number;
      y2Rel: number;
      totalWidth: number;
      totalHeight: number;
    }

    const computePairInterlocking = (
      p1: NestingPieceInput,
      rot1: number,
      p2: NestingPieceInput,
      rot2: number,
      gap: number
    ): PairInterlockResult => {
      const getPoly = (p: NestingPieceInput): Point2D[] => {
        if (p.cutPolygon && p.cutPolygon.length >= 3) {
          return p.cutPolygon;
        }
        return [
          { x: 0, y: 0 },
          { x: p.bbox.width, y: 0 },
          { x: p.bbox.width, y: p.bbox.height },
          { x: 0, y: p.bbox.height },
        ];
      };

      const poly1Rot = rotatePolyPoints(getPoly(p1), rot1);
      const poly2Rot = rotatePolyPoints(getPoly(p2), rot2);

      const minX1 = Math.min(...poly1Rot.map((pt) => pt.x));
      const minY1 = Math.min(...poly1Rot.map((pt) => pt.y));
      const maxX1 = Math.max(...poly1Rot.map((pt) => pt.x));
      const maxY1 = Math.max(...poly1Rot.map((pt) => pt.y));
      const p1Norm = poly1Rot.map((pt) => ({ x: pt.x - minX1, y: pt.y - minY1 }));
      const w1 = maxX1 - minX1;
      const h1 = maxY1 - minY1;

      const minX2 = Math.min(...poly2Rot.map((pt) => pt.x));
      const minY2 = Math.min(...poly2Rot.map((pt) => pt.y));
      const maxX2 = Math.max(...poly2Rot.map((pt) => pt.x));
      const maxY2 = Math.max(...poly2Rot.map((pt) => pt.y));
      const p2Norm = poly2Rot.map((pt) => ({ x: pt.x - minX2, y: pt.y - minY2 }));
      const w2 = maxX2 - minX2;
      const h2 = maxY2 - minY2;

      const maxH = Math.max(h1, h2);
      const step = 2.0;

      // Perfil 1: max X para cada Y
      const p1MaxX = new Array(Math.ceil(maxH / step) + 1).fill(-Infinity);
      for (let i = 0; i < p1Norm.length; i++) {
        const a = p1Norm[i];
        const b = p1Norm[(i + 1) % p1Norm.length];
        const yStart = Math.min(a.y, b.y);
        const yEnd = Math.max(a.y, b.y);
        const iStart = Math.max(0, Math.floor(yStart / step));
        const iEnd = Math.min(p1MaxX.length - 1, Math.ceil(yEnd / step));
        for (let yi = iStart; yi <= iEnd; yi++) {
          const y = yi * step;
          if (y >= yStart && y <= yEnd && yEnd > yStart) {
            const x = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y);
            if (x > p1MaxX[yi]) p1MaxX[yi] = x;
          }
        }
      }

      // Perfil 2: min X para cada Y
      const p2MinX = new Array(Math.ceil(maxH / step) + 1).fill(Infinity);
      for (let i = 0; i < p2Norm.length; i++) {
        const a = p2Norm[i];
        const b = p2Norm[(i + 1) % p2Norm.length];
        const yStart = Math.min(a.y, b.y);
        const yEnd = Math.max(a.y, b.y);
        const iStart = Math.max(0, Math.floor(yStart / step));
        const iEnd = Math.min(p2MinX.length - 1, Math.ceil(yEnd / step));
        for (let yi = iStart; yi <= iEnd; yi++) {
          const y = yi * step;
          if (y >= yStart && y <= yEnd && yEnd > yStart) {
            const x = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y);
            if (x < p2MinX[yi]) p2MinX[yi] = x;
          }
        }
      }

      let requiredShiftX = 0;
      for (let yi = 0; yi < p1MaxX.length; yi++) {
        if (p1MaxX[yi] > -Infinity && p2MinX[yi] < Infinity) {
          const needed = p1MaxX[yi] - p2MinX[yi] + gap;
          if (needed > requiredShiftX) requiredShiftX = needed;
        }
      }

      if (requiredShiftX <= 0) {
        requiredShiftX = w1 + gap;
      }

      const totalWidth = Number((requiredShiftX + w2).toFixed(2));
      const totalHeight = Number(maxH.toFixed(2));

      return {
        p1,
        rot1,
        w1,
        h1,
        x1Rel: 0,
        y1Rel: (totalHeight - h1) / 2,
        p2,
        rot2,
        w2,
        h2,
        x2Rel: requiredShiftX,
        y2Rel: (totalHeight - h2) / 2,
        totalWidth,
        totalHeight,
      };
    };

    interface ShortPlacedPieceInBlock {
      piece: NestingPieceInput;
      rotationDeg: number;
      xRel: number;
      yRel: number;
      w: number;
      h: number;
    }

    interface ShortBlockPlan {
      playerSet: PlayerShortSet;
      items: ShortPlacedPieceInBlock[];
      blockWidth: number;
      blockHeight: number;
    }

    const shortBlocks: ShortBlockPlan[] = [];
    const canRotate = customOptions?.allowRotation !== false;
    const rotationPolicy = customOptions?.rotationPolicy ?? (canRotate ? 'AUTO' : 'ESTRICTO_VERTICAL');
    const maxUsefulW = printableWidthMm - (sideMarginMm * 2);

    const filterRotationsByPolicy = (allowed: number[]) => {
      if (rotationPolicy === 'ESTRICTO_VERTICAL' || !canRotate) {
        return [0];
      }
      if (rotationPolicy === 'CABEZA_COLA') {
        return allowed.filter((r) => r === 0 || r === 180);
      }
      return allowed;
    };

    for (const playerSet of shortPlayerList) {
      const pIzq = playerSet.pantaIzq;
      const pDer = playerSet.pantaDer;

      if (pIzq && pDer) {
        const derRots = filterRotationsByPolicy(pDer.allowedRotations ?? [0]);
        const izqRots = filterRotationsByPolicy(pIzq.allowedRotations ?? [0]);
        const hasRotationPermission = derRots.some((r) => r !== 0) || izqRots.some((r) => r !== 0);

        if (hasRotationPermission) {
          type CandidateSpec = [NestingPieceInput, number, NestingPieceInput, number];
          const candidateSpecs: CandidateSpec[] = [];

          if (derRots.includes(0) && izqRots.includes(180)) candidateSpecs.push([pDer, 0, pIzq, 180]);
          if (izqRots.includes(0) && derRots.includes(180)) candidateSpecs.push([pIzq, 0, pDer, 180]);
          if (derRots.includes(90) && izqRots.includes(270)) candidateSpecs.push([pDer, 90, pIzq, 270]);
          if (izqRots.includes(90) && derRots.includes(270)) candidateSpecs.push([pIzq, 90, pDer, 270]);
          if (derRots.includes(270) && izqRots.includes(90)) candidateSpecs.push([pDer, 270, pIzq, 90]);
          if (izqRots.includes(270) && derRots.includes(90)) candidateSpecs.push([pIzq, 270, pDer, 90]);
          if (derRots.includes(90) && izqRots.includes(90)) candidateSpecs.push([pDer, 90, pIzq, 90]);
          if (derRots.includes(0) && izqRots.includes(0)) candidateSpecs.push([pDer, 0, pIzq, 0]);

          const candidateResults = candidateSpecs.map(([pA, rotA, pB, rotB]) =>
            computePairInterlocking(pA, rotA, pB, rotB, spacingMm)
          );

          const validCandidates = candidateResults.filter((c) => c.totalWidth <= maxUsefulW);
          validCandidates.sort((a, b) => {
            const hDiff = Number((a.totalHeight - b.totalHeight).toFixed(1));
            if (hDiff !== 0) return hDiff;
            const wDiff = Number((a.totalWidth - b.totalWidth).toFixed(1));
            if (wDiff !== 0) return wDiff;
            // Preferencia por puzzle tiro-con-tiro (donde rot1 !== rot2)
            const aIsPuzzle = (a.rot1 === 0 && a.rot2 === 180) || (a.rot1 === 90 && a.rot2 === 270);
            const bIsPuzzle = (b.rot1 === 0 && b.rot2 === 180) || (b.rot1 === 90 && b.rot2 === 270);
            if (aIsPuzzle && !bIsPuzzle) return -1;
            if (!aIsPuzzle && bIsPuzzle) return 1;
            return 0;
          });

          if (validCandidates.length > 0) {
            const best = validCandidates[0];
            shortBlocks.push({
              playerSet,
              items: [
                {
                  piece: best.p1,
                  rotationDeg: best.rot1,
                  xRel: best.x1Rel,
                  yRel: best.y1Rel,
                  w: best.w1,
                  h: best.h1,
                },
                {
                  piece: best.p2,
                  rotationDeg: best.rot2,
                  xRel: best.x2Rel,
                  yRel: best.y2Rel,
                  w: best.w2,
                  h: best.h2,
                },
              ],
              blockWidth: best.totalWidth,
              blockHeight: best.totalHeight,
            });
          } else {
            for (const singlePiece of [pDer, pIzq]) {
              shortBlocks.push({
                playerSet,
                items: [
                  {
                    piece: singlePiece,
                    rotationDeg: 0,
                    xRel: 0,
                    yRel: 0,
                    w: singlePiece.bbox.width,
                    h: singlePiece.bbox.height,
                  },
                ],
                blockWidth: singlePiece.bbox.width,
                blockHeight: singlePiece.bbox.height,
              });
            }
          }
        } else {
          // Si allowedRotations solo tiene [0] (sin permiso de rotación), acomodar individualmente
          for (const singlePiece of [pDer, pIzq]) {
            shortBlocks.push({
              playerSet,
              items: [
                {
                  piece: singlePiece,
                  rotationDeg: 0,
                  xRel: 0,
                  yRel: 0,
                  w: singlePiece.bbox.width,
                  h: singlePiece.bbox.height,
                },
              ],
              blockWidth: singlePiece.bbox.width,
              blockHeight: singlePiece.bbox.height,
            });
          }
        }
      } else if (pDer) {
        shortBlocks.push({
          playerSet,
          items: [
            {
              piece: pDer,
              rotationDeg: 0,
              xRel: 0,
              yRel: 0,
              w: pDer.bbox.width,
              h: pDer.bbox.height,
            },
          ],
          blockWidth: pDer.bbox.width,
          blockHeight: pDer.bbox.height,
        });
      } else if (pIzq) {
        shortBlocks.push({
          playerSet,
          items: [
            {
              piece: pIzq,
              rotationDeg: 0,
              xRel: 0,
              yRel: 0,
              w: pIzq.bbox.width,
              h: pIzq.bbox.height,
            },
          ],
          blockWidth: pIzq.bbox.width,
          blockHeight: pIzq.bbox.height,
        });
      }

      // Piezas accesorias del jugador (pretinas, ribetes, vivos de pantaloneta)
      if (playerSet.otherPieces && playerSet.otherPieces.length > 0) {
        for (const other of playerSet.otherPieces) {
          shortBlocks.push({
            playerSet,
            items: [
              {
                piece: other,
                rotationDeg: 0,
                xRel: 0,
                yRel: 0,
                w: other.bbox.width,
                h: other.bbox.height,
              },
            ],
            blockWidth: other.bbox.width,
            blockHeight: other.bbox.height,
          });
        }
      }
    }

    // 2. Empaquetado dinámico en filas (Multi-Piece Shelf Packing)
    // Permite que quepan 2, 3 o 4 pantalonetas según el ancho del plóter (1.12m, 1.60m, 1.80m, etc.)
    interface ShortRowPlan {
      blocks: ShortBlockPlan[];
      rowWidth: number;
      rowHeight: number;
    }

    const rows: ShortRowPlan[] = [];
    let currentRowBlocks: ShortBlockPlan[] = [];
    let currentRowWidth = 0;
    let currentRowHeight = 0;

    for (const block of shortBlocks) {
      const addedWidth = currentRowBlocks.length > 0 ? spacingMm + block.blockWidth : block.blockWidth;

      if (currentRowBlocks.length > 0 && currentRowWidth + addedWidth + (sideMarginMm * 2) > printableWidthMm) {
        rows.push({
          blocks: currentRowBlocks,
          rowWidth: currentRowWidth,
          rowHeight: currentRowHeight,
        });
        currentRowBlocks = [block];
        currentRowWidth = block.blockWidth;
        currentRowHeight = block.blockHeight;
      } else {
        currentRowBlocks.push(block);
        currentRowWidth += addedWidth;
        currentRowHeight = Math.max(currentRowHeight, block.blockHeight);
      }
    }

    if (currentRowBlocks.length > 0) {
      rows.push({
        blocks: currentRowBlocks,
        rowWidth: currentRowWidth,
        rowHeight: currentRowHeight,
      });
    }

    // 3. Posicionar cada fila centrada simétricamente y particionar pliegos de ser necesario
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const remainingRowsHeight = rows.slice(rIdx).reduce((acc, r) => acc + r.rowHeight + spacingMm, 0);

      // Particionado elástico de pliego (regla del 15% para evitar piezas huérfanas al final)
      const exceedsMax = shortRowY + row.rowHeight + topMarginMm > maxSheetLengthMm;
      const canAbsorbRemaining = shortRowY + remainingRowsHeight + topMarginMm <= maxSheetLengthMm * 1.15;

      if (exceedsMax && currentSheet.placedPieces.length > 0 && !canAbsorbRemaining) {
        const sheetHeight = Math.max(topMarginMm, shortRowY - spacingMm + topMarginMm);
        currentSheet.heightMm = Number(sheetHeight.toFixed(2));
        currentSheet.fileName = `PARTE_${currentSheet.sheetNumber}_SHORTS_${printableWidthMm.toFixed(0)}x${currentSheet.heightMm.toFixed(0)}mm`;

        currentSheet = createNewSheet('SHORT');
        shortRowY = topMarginMm;
      }

      // Centrado simétrico de la fila
      const leftoverWidth = Math.max(0, printableWidthMm - row.rowWidth);
      const rowStartX = Math.max(sideMarginMm, Number((leftoverWidth / 2.0).toFixed(2)));

      let currentBlockX = rowStartX;

      for (const block of row.blocks) {
        const blockVerticalOffset = (row.rowHeight - block.blockHeight) / 2.0;

        for (const item of block.items) {
          const finalX = currentBlockX + item.xRel;
          const finalY = shortRowY + blockVerticalOffset + item.yRel;

          const placed: PlacedNestingPiece = {
            ...item.piece,
            xMm: Number(finalX.toFixed(2)),
            yMm: Number(finalY.toFixed(2)),
            rotationDeg: item.rotationDeg,
            effectiveWidthMm: Number(item.w.toFixed(2)),
            effectiveHeightMm: Number(item.h.toFixed(2)),
            isLocked: false,
            sheetIndex: currentSheet.sheetNumber - 1,
          };

          currentSheet.placedPieces.push(placed);
          allPlacedPieces.push(placed);

          if (!currentSheet.playerNames.includes(block.playerSet.playerName)) {
            currentSheet.playerNames.push(block.playerSet.playerName);
          }
        }

        currentBlockX += block.blockWidth + spacingMm;
      }

      shortRowY += row.rowHeight + spacingMm;
    }

    const finalSheetHeight = Math.max(topMarginMm, shortRowY - spacingMm + topMarginMm);
    currentSheet.heightMm = Number(finalSheetHeight.toFixed(2));
    currentSheet.fileName = `PARTE_${currentSheet.sheetNumber}_SHORTS_${printableWidthMm.toFixed(0)}x${currentSheet.heightMm.toFixed(0)}mm`;
  }

  // 4. Calcular métricas por pliego y globales
  let totalPiecesAreaMm2 = 0;
  let totalUsedAreaMm2 = 0;
  let totalRollLengthMm = 0;

  for (const sheet of sheets) {
    let sheetPiecesArea = 0;
    for (const p of sheet.placedPieces) {
      sheetPiecesArea += p.areaMm2 || (p.effectiveWidthMm * p.effectiveHeightMm);
    }
    const sheetUsedArea = sheet.widthMm * sheet.heightMm;
    const util = sheetUsedArea > 0 ? Math.min(100, (sheetPiecesArea / sheetUsedArea) * 100) : 0;

    sheet.totalPiecesAreaMm2 = sheetPiecesArea;
    sheet.usedAreaMm2 = sheetUsedArea;
    sheet.utilizationPercent = Number(util.toFixed(1));
    sheet.wastePercent = Number((100 - util).toFixed(1));

    totalPiecesAreaMm2 += sheetPiecesArea;
    totalUsedAreaMm2 += sheetUsedArea;
    totalRollLengthMm += sheet.heightMm;
  }

  const globalUtil = totalUsedAreaMm2 > 0 ? (totalPiecesAreaMm2 / totalUsedAreaMm2) * 100 : 0;
  const executionTimeMs = performance.now() - startTime;

  return {
    placedPieces: allPlacedPieces,
    sheets,
    activeSheetIndex: 0,
    totalRollLengthMm: Number(totalRollLengthMm.toFixed(2)),
    printableWidthMm,
    maxSheetLengthMm,
    totalPiecesAreaMm2,
    usedRollAreaMm2: totalUsedAreaMm2,
    utilizationPercent: Number(globalUtil.toFixed(1)),
    wastePercent: Number((100 - globalUtil).toFixed(1)),
    executionTimeMs: Number(executionTimeMs.toFixed(1)),
    groupingMode: 'MODULAR_PLAYER',
  };
}
