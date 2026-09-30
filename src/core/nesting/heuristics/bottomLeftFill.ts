import { 
  NestingPieceInput, 
  PlacedNestingPiece, 
  NestingOptions, 
  NestingResult 
} from '../types';

/**
 * Checks if two bounding boxes with safety spacing overlap.
 */
function doBoxesCollide(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  spacing: number
): boolean {
  // If either box is completely outside the other plus spacing on any axis, no collision
  if (x1 + w1 + spacing <= x2) return false;
  if (x2 + w2 + spacing <= x1) return false;
  if (y1 + h1 + spacing <= y2) return false;
  if (y2 + h2 + spacing <= y1) return false;
  return true;
}

/**
 * Natural comparator for clothing sizes (e.g. 26, 28, 30, S, M, L, XL)
 */
function compareSizes(a: string, b: string): number {
  const standardOrder = ['24', '26', '28', '30', '32', '34', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  const idxA = standardOrder.indexOf(a.toUpperCase());
  const idxB = standardOrder.indexOf(b.toUpperCase());

  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;

  // Numerical comparison if both numbers
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

  return a.localeCompare(b);
}

/**
 * Heurística Bottom-Left-Fill (BLF) para Strip Packing 2D continuo con ancho fijo.
 */
export function executeBottomLeftFill(
  pieces: NestingPieceInput[],
  options: NestingOptions
): NestingResult {
  const startTime = performance.now();
  const { printableWidthMm, spacingMm, groupingMode } = options;
  const sideMarginMm = options.sideMarginMm !== undefined ? Math.max(0, options.sideMarginMm) : 5.0;
  const topMarginMm = options.topMarginMm !== undefined ? Math.max(0, options.topMarginMm) : 5.0;
  const effectivePrintableWidth = Math.max(10, printableWidthMm - sideMarginMm);

  // 1. Separar piezas fijadas (Locked) de piezas libres
  const lockedPieces: PlacedNestingPiece[] = [];
  const freePieces: NestingPieceInput[] = [];

  for (const p of pieces) {
    if (p.isLocked && p.xMm !== undefined && p.yMm !== undefined) {
      const rot = p.rotationDeg || 0;
      const isSwapped = rot === 90 || rot === 270;
      const effW = isSwapped ? p.bbox.height : p.bbox.width;
      const effH = isSwapped ? p.bbox.width : p.bbox.height;
      const minX = sideMarginMm;
      const maxX = Math.max(minX, effectivePrintableWidth - effW);

      lockedPieces.push({
        ...p,
        xMm: Math.max(minX, Math.min(p.xMm, maxX)),
        yMm: Math.max(topMarginMm, p.yMm),
        rotationDeg: rot,
        effectiveWidthMm: effW,
        effectiveHeightMm: effH,
        isLocked: true,
      });
    } else {
      freePieces.push({ ...p, isLocked: false });
    }
  }

  // 2. Ordenar las piezas libres según el modo de agrupamiento
  let sortedFreePieces: NestingPieceInput[] = [];

  switch (groupingMode) {
    case 'MAX_SAVINGS':
      // First-Fit Decreasing Height (FFDH): primero las más altas, luego más área
      sortedFreePieces = [...freePieces].sort((a, b) => {
        const diffH = b.bbox.height - a.bbox.height;
        if (Math.abs(diffH) > 0.001) return diffH;
        return b.areaMm2 - a.areaMm2;
      });
      break;

    case 'BY_SIZE':
      // Agrupadas por talla en orden estándar, luego por altura dentro de cada talla
      sortedFreePieces = [...freePieces].sort((a, b) => {
        const sizeComp = compareSizes(a.sizeName, b.sizeName);
        if (sizeComp !== 0) return sizeComp;
        return b.bbox.height - a.bbox.height;
      });
      break;

    case 'BY_PLAYER':
      // Agrupadas por jugador (orderItemId) para que todas sus piezas queden juntas
      sortedFreePieces = [...freePieces].sort((a, b) => {
        if (a.orderItemId !== b.orderItemId) {
          return a.orderItemId.localeCompare(b.orderItemId);
        }
        return b.bbox.height - a.bbox.height;
      });
      break;

    case 'BY_PIECE_TYPE':
      // Agrupadas por tipo de pieza (Delanteros, Espaldas, Mangas, Shorts)
      sortedFreePieces = [...freePieces].sort((a, b) => {
        if (a.pieceType !== b.pieceType) {
          return a.pieceType.localeCompare(b.pieceType);
        }
        return b.bbox.height - a.bbox.height;
      });
      break;

    default:
      // First-Fit Decreasing Height (FFDH) por defecto
      sortedFreePieces = [...freePieces].sort((a, b) => {
        const diffH = b.bbox.height - a.bbox.height;
        if (Math.abs(diffH) > 0.001) return diffH;
        return b.areaMm2 - a.areaMm2;
      });
      break;
  }

  // 3. Inicializar el lecho de colocación con las piezas bloqueadas
  const placedPieces: PlacedNestingPiece[] = [...lockedPieces];

  // Helper para determinar el baseline actual (en modo BY_SIZE, si queremos separación clara)
  let currentGroupKey: string | null = null;
  let groupBaselineY = topMarginMm;

  // 4. Colocar iterativamente cada pieza libre usando Bottom-Left Search
  for (const piece of sortedFreePieces) {
    // Si estamos en modo BY_SIZE con separación por bloques de talla
    if (groupingMode === 'BY_SIZE') {
      if (currentGroupKey === null) {
        currentGroupKey = piece.sizeName;
      } else if (currentGroupKey !== piece.sizeName) {
        // Nueva talla detectada: calcular nuevo baseline al final de la talla anterior
        let maxExistingY = 0;
        for (const pl of placedPieces) {
          const top = pl.yMm + pl.effectiveHeightMm;
          if (top > maxExistingY) maxExistingY = top;
        }
        groupBaselineY = maxExistingY > 0 ? maxExistingY + spacingMm : topMarginMm;
        currentGroupKey = piece.sizeName;
      }
    }

    // Orientaciones posibles de la pieza
    const allowedRotations = (piece.allowedRotations && piece.allowedRotations.length > 0)
      ? piece.allowedRotations
      : [0];

    // Buscamos la mejor posición (mínimo Y, luego mínimo X) entre las orientaciones permitidas
    let bestX = -1;
    let bestY = -1;
    let bestRotation = 0;
    let bestEffW = piece.bbox.width;
    let bestEffH = piece.bbox.height;
    let bestScore = Infinity;

    for (const rot of allowedRotations) {
      const isSwapped = rot === 90 || rot === 270;
      const effW = isSwapped ? piece.bbox.height : piece.bbox.width;
      const effH = isSwapped ? piece.bbox.width : piece.bbox.height;

      // Si la pieza sola es más ancha que el área imprimible con margen, no cabe en esta rotación
      if (effW > effectivePrintableWidth - sideMarginMm) continue;

      // Generar coordenadas candidatas X e Y
      const candidateXs = new Set<number>();
      const candidateYs = new Set<number>();

      candidateXs.add(sideMarginMm);
      candidateYs.add(groupBaselineY);

      for (const pl of placedPieces) {
        // Candidato a la derecha de pieza colocada
        const rightX = pl.xMm + pl.effectiveWidthMm + spacingMm;
        if (rightX + effW <= effectivePrintableWidth) {
          candidateXs.add(rightX);
        }

        // Candidato encima de pieza colocada
        const topY = pl.yMm + pl.effectiveHeightMm + spacingMm;
        if (topY >= groupBaselineY) {
          candidateYs.add(topY);
        }
      }

      // Ordenar puntos candidatos: Y ascendente (Bottom), luego X ascendente (Left)
      const sortedYs = Array.from(candidateYs).sort((a, b) => a - b);
      const sortedXs = Array.from(candidateXs).sort((a, b) => a - b);

      let foundForRotation = false;

      for (const y of sortedYs) {
        // Poda: si este Y ya supera el mejor score actual, no puede mejorar
        if (y >= bestScore) break;

        for (const x of sortedXs) {
          // Validar contención en el ancho útil con márgenes
          if (x < sideMarginMm || x + effW > effectivePrintableWidth) continue;

          // Validar colisión contra todas las piezas ya colocadas
          let collision = false;
          for (let i = 0; i < placedPieces.length; i++) {
            const pl = placedPieces[i];
            if (doBoxesCollide(x, y, effW, effH, pl.xMm, pl.yMm, pl.effectiveWidthMm, pl.effectiveHeightMm, spacingMm)) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            // Posición válida encontrada: score = Y * 100000 + X
            const score = y * 100000 + x;
            if (score < bestScore) {
              bestScore = score;
              bestX = x;
              bestY = y;
              bestRotation = rot;
              bestEffW = effW;
              bestEffH = effH;
            }
            foundForRotation = true;
            break; // Siguiente Y o terminar puesto que X está ordenado
          }
        }
        if (foundForRotation && bestY === y) {
          // Encontrado en este nivel Y, no hay nada con menor Y
          break;
        }
      }
    }

    // Si por algún motivo extremo no cupo en candidatos, colocar al final del rollo
    if (bestX === -1 || bestY === -1) {
      let maxExistingY = groupBaselineY;
      for (const pl of placedPieces) {
        const top = pl.yMm + pl.effectiveHeightMm;
        if (top > maxExistingY) maxExistingY = top;
      }
      bestX = sideMarginMm;
      bestY = maxExistingY > 0 ? maxExistingY + spacingMm : groupBaselineY;
      bestRotation = 0;
      bestEffW = piece.bbox.width;
      bestEffH = piece.bbox.height;
    }

    placedPieces.push({
      ...piece,
      xMm: Number(bestX.toFixed(2)),
      yMm: Number(bestY.toFixed(2)),
      rotationDeg: bestRotation,
      effectiveWidthMm: Number(bestEffW.toFixed(2)),
      effectiveHeightMm: Number(bestEffH.toFixed(2)),
      isLocked: false,
    });
  }

  // 5. Calcular métricas finales de producción
  let maxRollLengthMm = 0;
  let totalPiecesAreaMm2 = 0;

  for (const pl of placedPieces) {
    const bottomMm = pl.yMm + pl.effectiveHeightMm;
    if (bottomMm > maxRollLengthMm) {
      maxRollLengthMm = bottomMm;
    }
    totalPiecesAreaMm2 += pl.areaMm2;
  }

  // Margen de seguridad final
  const totalRollLengthMm = Number(maxRollLengthMm.toFixed(2));
  const usedRollAreaMm2 = Number((printableWidthMm * totalRollLengthMm).toFixed(2));
  
  let utilizationPercent = 0;
  if (usedRollAreaMm2 > 0) {
    utilizationPercent = Math.min(100.0, Number(((totalPiecesAreaMm2 / usedRollAreaMm2) * 100).toFixed(2)));
  }
  const wastePercent = Number((100.0 - utilizationPercent).toFixed(2));
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    placedPieces,
    totalRollLengthMm,
    printableWidthMm,
    totalPiecesAreaMm2: Number(totalPiecesAreaMm2.toFixed(2)),
    usedRollAreaMm2,
    utilizationPercent,
    wastePercent,
    executionTimeMs,
    groupingMode,
  };
}
