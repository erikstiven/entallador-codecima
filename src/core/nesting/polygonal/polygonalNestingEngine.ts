import { 
  NestingPieceInput, 
  PlacedNestingPiece, 
  NestingOptions, 
  NestingResult 
} from '../types';
import { executeBottomLeftFill } from '../heuristics/bottomLeftFill';
import { 
  getClipperInstance, 
  polygonToPath64, 
  inflatePolygon 
} from '../../geometry/clipperService';
import { getOrientedPolygon, computeBoundingBox } from '../../geometry/transform';
import { Polygon2D } from '../../geometry/types';

interface InflatedPlacedItem {
  id: string;
  piece: PlacedNestingPiece;
  inflatedPoly: Polygon2D;
  inflatedBbox: { minX: number; minY: number; maxX: number; maxY: number };
  path64: any; // Clipper Path64
  paths64: any; // Clipper Paths64
}

/**
 * Motor de Nesting 2D Avanzado Poligonal (Fase B con Clipper2)
 * Aplica empaquetado poligonal irregular con compactación por deslizamiento (sliding compaction),
 * encajando piezas cóncavas (mangas, cuellos) en los huecos de cuerpos y shorts.
 */
export async function runPolygonalNesting(
  pieces: NestingPieceInput[],
  options: NestingOptions,
  onProgress?: (progress: number) => void
): Promise<NestingResult> {
  const startTime = performance.now();
  const clip = await getClipperInstance();
  const { printableWidthMm, spacingMm } = options;

  // 1. Obtener la colocación inicial mediante la Heurística Fase A (Bottom-Left-Fill)
  const initialResult = executeBottomLeftFill(pieces, options);

  if (initialResult.placedPieces.length === 0) {
    return initialResult;
  }

  // 2. Ordenar las piezas colocadas por Y ascendente (de abajo hacia arriba en el rollo)
  const sortedPieces = [...initialResult.placedPieces].sort((a, b) => a.yMm - b.yMm);

  const placedItems: InflatedPlacedItem[] = [];
  const finalPlacedPieces: PlacedNestingPiece[] = [];

  // Helper para liberar memoria C++ de un item
  const cleanupItem = (item: InflatedPlacedItem) => {
    try {
      item.path64?.delete();
      item.paths64?.delete();
    } catch {}
  };

  // 3. Compactar progresivamente cada pieza contra el lecho de piezas inferiores
  for (let i = 0; i < sortedPieces.length; i++) {
    const p = sortedPieces[i];

    if (onProgress) {
      onProgress(Math.round(((i + 1) / sortedPieces.length) * 100));
    }

    // Si la pieza está bloqueada, conservar estrictamente su posición y añadirla al lecho
    if (p.isLocked) {
      const placedPoly = getOrientedPolygon(p.cutPolygon, p.rotationDeg, p.xMm, p.yMm);
      const inflatedList = await inflatePolygon(placedPoly, spacingMm, 'Square');
      const inflatedPoly = inflatedList[0] || placedPoly;
      const infBbox = computeBoundingBox(inflatedPoly);

      const path = polygonToPath64(clip, inflatedPoly);
      const paths = new clip.Paths64();
      paths.push_back(path);

      const item: InflatedPlacedItem = {
        id: p.id,
        piece: { ...p },
        inflatedPoly,
        inflatedBbox: infBbox,
        path64: path,
        paths64: paths,
      };

      placedItems.push(item);
      finalPlacedPieces.push({ ...p });
      continue;
    }

    // Pieza libre: evaluar orientaciones permitidas y buscar la máxima compactación hacia abajo
    const allowedRotations = (p.allowedRotations && p.allowedRotations.length > 0)
      ? p.allowedRotations
      : [0];

    let bestX = p.xMm;
    let bestY = p.yMm;
    let bestRotation = p.rotationDeg;
    let bestEffW = p.effectiveWidthMm;
    let bestEffH = p.effectiveHeightMm;

    // Evaluamos cada orientación permitida (ej: 0° y 180° para mangas/shorts)
    for (const rot of allowedRotations) {
      const isSwapped = rot === 90 || rot === 270;
      const effW = isSwapped ? p.bbox.height : p.bbox.width;
      const effH = isSwapped ? p.bbox.width : p.bbox.height;

      if (effW > printableWidthMm) continue;

      // Partimos de la posición de la heurística o probamos deslizar hacia abajo
      let currentX = Math.min(p.xMm, printableWidthMm - effW);
      let currentY = p.yMm;

      // Paso de deslizamiento poligonal vertical (Sliding compaction)
      // Probamos bajar con decrementos hasta encontrar el contacto poligonal
      const stepMm = 10.0;
      let lowestY = currentY;

      while (lowestY - stepMm >= 0) {
        const testY = lowestY - stepMm;
        const candidatePoly = getOrientedPolygon(p.cutPolygon, rot, currentX, testY);

        // Verificamos si candidatePoly colisiona con alguna de las piezas colocadas infladas
        let hasCollision = false;

        const candBbox = computeBoundingBox(candidatePoly);
        const candPath = polygonToPath64(clip, candidatePoly);
        const candPaths = new clip.Paths64();
        candPaths.push_back(candPath);

        for (const item of placedItems) {
          // Poda AABB
          if (
            candBbox.maxX < item.inflatedBbox.minX ||
            candBbox.minX > item.inflatedBbox.maxX ||
            candBbox.maxY < item.inflatedBbox.minY ||
            candBbox.minY > item.inflatedBbox.maxY
          ) {
            continue;
          }

          // Test poligonal exacto con Clipper2
          const intersection = clip.Intersect64(candPaths, item.paths64, clip.FillRule.NonZero);
          const overlaps = intersection.size() > 0 && Math.abs(clip.AreaPaths64(intersection)) > 1000;
          intersection.delete();

          if (overlaps) {
            hasCollision = true;
            break;
          }
        }

        candPath.delete();
        candPaths.delete();

        if (hasCollision) {
          // Contacto alcanzado en este nivel
          break;
        }

        lowestY = testY;
      }

      // Si logramos bajar la pieza más que con la rotación previa
      if (lowestY < bestY) {
        bestY = lowestY;
        bestX = currentX;
        bestRotation = rot;
        bestEffW = effW;
        bestEffH = effH;
      }
    }

    // Registrar la pieza compactada
    const finalPlacedPiece: PlacedNestingPiece = {
      ...p,
      xMm: Number(bestX.toFixed(2)),
      yMm: Number(bestY.toFixed(2)),
      rotationDeg: bestRotation,
      effectiveWidthMm: Number(bestEffW.toFixed(2)),
      effectiveHeightMm: Number(bestEffH.toFixed(2)),
      isLocked: false,
    };

    finalPlacedPieces.push(finalPlacedPiece);

    // Inflar y añadir al lecho para las siguientes piezas
    const placedPoly = getOrientedPolygon(
      p.cutPolygon,
      finalPlacedPiece.rotationDeg,
      finalPlacedPiece.xMm,
      finalPlacedPiece.yMm
    );

    const inflatedList = await inflatePolygon(placedPoly, spacingMm, 'Square');
    const inflatedPoly = inflatedList[0] || placedPoly;
    const infBbox = computeBoundingBox(inflatedPoly);

    const path = polygonToPath64(clip, inflatedPoly);
    const paths = new clip.Paths64();
    paths.push_back(path);

    placedItems.push({
      id: p.id,
      piece: finalPlacedPiece,
      inflatedPoly,
      inflatedBbox: infBbox,
      path64: path,
      paths64: paths,
    });
  }

  // Liberar memoria C++ de todos los items
  for (const item of placedItems) {
    cleanupItem(item);
  }

  // 4. Calcular métricas finales post-compactación
  let maxRollLengthMm = 0;
  let totalPiecesAreaMm2 = 0;

  for (const pl of finalPlacedPieces) {
    const bottom = pl.yMm + pl.effectiveHeightMm;
    if (bottom > maxRollLengthMm) {
      maxRollLengthMm = bottom;
    }
    totalPiecesAreaMm2 += pl.areaMm2;
  }

  const totalRollLengthMm = Number(maxRollLengthMm.toFixed(2));
  const usedRollAreaMm2 = Number((printableWidthMm * totalRollLengthMm).toFixed(2));
  let utilizationPercent = 0;
  if (usedRollAreaMm2 > 0) {
    utilizationPercent = Math.min(100.0, Number(((totalPiecesAreaMm2 / usedRollAreaMm2) * 100).toFixed(2)));
  }
  const wastePercent = Number((100.0 - utilizationPercent).toFixed(2));
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    placedPieces: finalPlacedPieces,
    totalRollLengthMm,
    printableWidthMm,
    totalPiecesAreaMm2: Number(totalPiecesAreaMm2.toFixed(2)),
    usedRollAreaMm2,
    utilizationPercent,
    wastePercent,
    executionTimeMs,
    groupingMode: options.groupingMode,
  };
}
