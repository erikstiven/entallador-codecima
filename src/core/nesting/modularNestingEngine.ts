import {
  NestingPieceInput,
  PlacedNestingPiece,
  NestingOptions,
  NestingResult,
  NestingSheet,
} from './types';

const DEFAULT_PRINTABLE_WIDTH_MM = 1120.0;
const DEFAULT_MAX_SHEET_LENGTH_MM = 5000.0; // 5.0 metros
const DEFAULT_SPACING_MM = 3.0; // Separación compacta de 3 mm
const DEFAULT_SIDE_MARGIN_MM = 3.0; // Margen lateral de 3 mm
const DEFAULT_TOP_MARGIN_MM = 4.0; // Margen superior/inferior de 4 mm

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
      else if (pType === 'MANGA_IZQ') set.mangaIzq = piece;
      else if (pType === 'MANGA_DER') set.mangaDer = piece;
      else if (pType === 'CUELLO') set.cuello = piece;
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
    let currentSheet = createNewSheet('CAMISETA');
    let jerseyY = topMarginMm;

    // Calcular ancho máximo de delanteros y espaldas
    const maxDelanteroW = camisetaPlayerList.reduce((max, p) => Math.max(max, p.delantero?.bbox.width || 0), 0) || 400;
    const maxEspaldaW = camisetaPlayerList.reduce((max, p) => Math.max(max, p.espalda?.bbox.width || 0), 0) || 400;
    const shirtsBandWidth = sideMarginMm + maxDelanteroW + spacingMm + maxEspaldaW;
    const rightBandX = Number((shirtsBandWidth + spacingMm).toFixed(2));
    const availableRightWidth = printableWidthMm - rightBandX - sideMarginMm;

    const sheetSleeves: NestingPieceInput[] = [];
    const sheetCollars: NestingPieceInput[] = [];

    /**
     * Fase 2 por pliego: Empaquetado inteligente de mangas (columna derecha limitada a jerseyBottomY)
     * + Evaluador Multi-Variante (Variantes 1, 2 y 3) para la zona inferior bajo las camisetas
     * + Empaquetado de cuellos y piezas adicionales.
     */
    const planSheetAccessories = (
      jerseyBottomY: number,
      sleevesToPlace: NestingPieceInput[],
      collarsToPlace: NestingPieceInput[],
      sheetIdx: number
    ): { placedAccessories: PlacedNestingPiece[]; bottomY: number; heightMm: number } => {
      const placedAccessories: PlacedNestingPiece[] = [];
      const remainingSleeves: NestingPieceInput[] = [];
      const remainingCollars: NestingPieceInput[] = [];

      const hasJerseys = jerseyBottomY > topMarginMm;
      let mangaY = topMarginMm;
      let sleeveToggleRotation = 90; // Alterna 90° y 270° para encastre intercalado

      // 2.1 Colocar mangas en la Columna Derecha ÚNICAMENTE mientras mangaY + sH <= jerseyBottomY
      let i = 0;
      while (i < sleevesToPlace.length) {
        const m1 = sleevesToPlace[i];
        const m2 = i + 1 < sleevesToPlace.length ? sleevesToPlace[i + 1] : undefined;

        const sW1 = m1.bbox.height; // rot 90/270
        const sH1 = m1.bbox.width;
        const sW2 = m2 ? m2.bbox.height : 0;
        const sH2 = m2 ? m2.bbox.width : 0;

        const canFitDoubleColumn = m2 !== undefined && availableRightWidth >= sW1 + spacingMm + sW2;
        const canFitSingleColumn = availableRightWidth >= sW1;

        if (canFitDoubleColumn && m2) {
          const pairH = Math.max(sH1, sH2);
          if (!hasJerseys || mangaY + pairH <= jerseyBottomY) {
            const col1X = rightBandX;
            const col2X = Number((rightBandX + sW1 + spacingMm).toFixed(2));

            placedAccessories.push(
              {
                ...m1,
                xMm: col1X,
                yMm: Number(mangaY.toFixed(2)),
                rotationDeg: 90,
                effectiveWidthMm: sW1,
                effectiveHeightMm: sH1,
                isLocked: false,
                sheetIndex: sheetIdx,
              },
              {
                ...m2,
                xMm: col2X,
                yMm: Number(mangaY.toFixed(2)),
                rotationDeg: 90,
                effectiveWidthMm: sW2,
                effectiveHeightMm: sH2,
                isLocked: false,
                sheetIndex: sheetIdx,
              }
            );
            mangaY += pairH + spacingMm;
            i += 2;
            continue;
          }
        }

        if (canFitSingleColumn && (!hasJerseys || mangaY + sH1 <= jerseyBottomY)) {
          placedAccessories.push({
            ...m1,
            xMm: rightBandX,
            yMm: Number(mangaY.toFixed(2)),
            rotationDeg: sleeveToggleRotation,
            effectiveWidthMm: sW1,
            effectiveHeightMm: sH1,
            isLocked: false,
            sheetIndex: sheetIdx,
          });
          mangaY += sH1 + spacingMm;
          sleeveToggleRotation = sleeveToggleRotation === 90 ? 270 : 90;
          i += 1;
        } else {
          // REGLA DE ORO: Rebasaría jerseyBottomY (o no cabe en columna derecha) -> enviar a zona inferior
          remainingSleeves.push(m1);
          i += 1;
        }
      }

      // 2.2 Evaluador Inteligente Multi-Variante para remainingSleeves en la zona inferior
      let bottomY = Math.max(jerseyBottomY, mangaY);

      if (remainingSleeves.length > 0) {
        const baseStartY = Math.max(jerseyBottomY, mangaY);

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

        // --- VARIANTE 3: Híbrida Compacta (bajo columnas de camiseta + nivelación con columna derecha) ---
        const evalVariant3 = (): { pieces: PlacedNestingPiece[]; bottomY: number } => {
          const pieces: PlacedNestingPiece[] = [];
          const leftBandLimitX = rightBandX - spacingMm;
          let leftX = sideMarginMm;
          let leftY = jerseyBottomY;
          let leftRowH = 0;
          let rightY = mangaY;
          let leftRotToggle = 0;
          let rightRotToggle = sleeveToggleRotation;

          for (const sleeve of remainingSleeves) {
            const hW = sleeve.bbox.width;
            const hH = sleeve.bbox.height;
            const vW = sleeve.bbox.height;
            const vH = sleeve.bbox.width;

            // Si la fila izquierda ya superó a rightY, podemos usar todo el ancho disponible
            const currentRowMaxX = leftY >= rightY ? printableWidthMm - sideMarginMm : leftBandLimitX;

            if (leftX + hW <= currentRowMaxX) {
              pieces.push({
                ...sleeve,
                xMm: Number(leftX.toFixed(2)),
                yMm: Number(leftY.toFixed(2)),
                rotationDeg: leftRotToggle,
                effectiveWidthMm: hW,
                effectiveHeightMm: hH,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              leftRotToggle = leftRotToggle === 0 ? 180 : 0;
              leftX += hW + spacingMm;
              leftRowH = Math.max(leftRowH, hH);
              continue;
            }

            // Si ya hay mangas en la fila inferior bajo camisetas y la columna derecha tiene hueco para nivelar
            const projectedLeftBottom = leftY + (leftRowH > 0 ? leftRowH + spacingMm : 0);
            if (
              leftRowH > 0 &&
              availableRightWidth >= vW &&
              rightY + vH + spacingMm <= projectedLeftBottom + hH
            ) {
              pieces.push({
                ...sleeve,
                xMm: rightBandX,
                yMm: Number(rightY.toFixed(2)),
                rotationDeg: rightRotToggle,
                effectiveWidthMm: vW,
                effectiveHeightMm: vH,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              rightRotToggle = rightRotToggle === 90 ? 270 : 90;
              rightY += vH + spacingMm;
              continue;
            }

            // Avanzar a una nueva fila inferior
            if (leftRowH > 0) {
              leftY += leftRowH + spacingMm;
              leftX = sideMarginMm;
              leftRowH = 0;
            }

            const newRowMaxX = leftY >= rightY ? printableWidthMm - sideMarginMm : leftBandLimitX;
            if (leftX + hW <= newRowMaxX) {
              pieces.push({
                ...sleeve,
                xMm: Number(leftX.toFixed(2)),
                yMm: Number(leftY.toFixed(2)),
                rotationDeg: leftRotToggle,
                effectiveWidthMm: hW,
                effectiveHeightMm: hH,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              leftRotToggle = leftRotToggle === 0 ? 180 : 0;
              leftX += hW + spacingMm;
              leftRowH = Math.max(leftRowH, hH);
            } else {
              // Usar el ancho completo desde Math.max(leftY, rightY)
              leftY = Math.max(leftY, rightY);
              leftX = sideMarginMm;
              pieces.push({
                ...sleeve,
                xMm: Number(leftX.toFixed(2)),
                yMm: Number(leftY.toFixed(2)),
                rotationDeg: leftRotToggle,
                effectiveWidthMm: hW,
                effectiveHeightMm: hH,
                isLocked: false,
                sheetIndex: sheetIdx,
              });
              leftRotToggle = leftRotToggle === 0 ? 180 : 0;
              leftX += hW + spacingMm;
              leftRowH = Math.max(leftRowH, hH);
            }
          }

          if (leftRowH > 0) {
            leftY += leftRowH + spacingMm;
          }

          return { pieces, bottomY: Math.max(leftY, rightY) };
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

      // 2.3 Cuellos y piezas adicionales: aprovechar hueco residual en columna derecha o empacar al fondo
      for (const collar of collarsToPlace) {
        const cW = collar.bbox.width;
        const cH = collar.bbox.height;
        if (remainingSleeves.length === 0 && mangaY + cH <= jerseyBottomY && availableRightWidth >= cW) {
          placedAccessories.push({
            ...collar,
            xMm: rightBandX,
            yMm: Number(mangaY.toFixed(2)),
            rotationDeg: 0,
            effectiveWidthMm: cW,
            effectiveHeightMm: cH,
            isLocked: false,
            sheetIndex: sheetIdx,
          });
          mangaY += cH + spacingMm;
          bottomY = Math.max(bottomY, mangaY);
        } else {
          remainingCollars.push(collar);
        }
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

    const finalizeCurrentSheet = () => {
      const plan = planSheetAccessories(
        jerseyY,
        sheetSleeves,
        sheetCollars,
        currentSheet.sheetNumber - 1
      );
      currentSheet.placedPieces.push(...plan.placedAccessories);
      allPlacedPieces.push(...plan.placedAccessories);
      currentSheet.heightMm = plan.heightMm;
      currentSheet.fileName = `PARTE_${currentSheet.sheetNumber}_CAMISETAS_${printableWidthMm.toFixed(0)}x${currentSheet.heightMm.toFixed(0)}mm`;

      sheetSleeves.length = 0;
      sheetCollars.length = 0;
    };

    for (const playerSet of camisetaPlayerList) {
      const del = playerSet.delantero;
      const esp = playerSet.espalda;
      const m1 = playerSet.mangaIzq;
      const m2 = playerSet.mangaDer;
      const cuello = playerSet.cuello;

      const wDel = del ? del.bbox.width : 0;
      const hDel = del ? del.bbox.height : 0;
      const wEsp = esp ? esp.bbox.width : 0;
      const hEsp = esp ? esp.bbox.height : 0;
      const jerseyRowH = Math.max(hDel, hEsp);

      const candidateSleeves = [...sheetSleeves];
      if (m1) candidateSleeves.push(m1);
      if (m2) candidateSleeves.push(m2);

      const candidateCollars = [...sheetCollars];
      if (cuello) candidateCollars.push(cuello);
      for (const o of playerSet.otherPieces) candidateCollars.push(o);

      const nextJerseyY = jerseyY + (jerseyRowH > 0 ? jerseyRowH + spacingMm : 0);
      const projectedPlan = planSheetAccessories(
        nextJerseyY,
        candidateSleeves,
        candidateCollars,
        currentSheet.sheetNumber - 1
      );

      // Particionado de pliego si las camisetas o el empaquetado total exceden la longitud máxima
      if (
        (jerseyY + jerseyRowH + topMarginMm > maxSheetLengthMm || projectedPlan.heightMm > maxSheetLengthMm) &&
        (currentSheet.placedPieces.length > 0 || sheetSleeves.length > 0 || sheetCollars.length > 0)
      ) {
        finalizeCurrentSheet();
        currentSheet = createNewSheet('CAMISETA');
        jerseyY = topMarginMm;
      }

      // Fase 1: Colocar cuerpos (Frente y Espalda) y recolectar mangas y cuellos del pliego
      const delX = sideMarginMm;
      if (del) {
        const placedDel: PlacedNestingPiece = {
          ...del,
          xMm: delX,
          yMm: Number(jerseyY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: wDel,
          effectiveHeightMm: hDel,
          isLocked: false,
          sheetIndex: currentSheet.sheetNumber - 1,
        };
        currentSheet.placedPieces.push(placedDel);
        allPlacedPieces.push(placedDel);
      }

      const espX = Number((sideMarginMm + maxDelanteroW + spacingMm).toFixed(2));
      if (esp) {
        const placedEsp: PlacedNestingPiece = {
          ...esp,
          xMm: espX,
          yMm: Number(jerseyY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: wEsp,
          effectiveHeightMm: hEsp,
          isLocked: false,
          sheetIndex: currentSheet.sheetNumber - 1,
        };
        currentSheet.placedPieces.push(placedEsp);
        allPlacedPieces.push(placedEsp);
      }

      if (jerseyRowH > 0) {
        jerseyY += jerseyRowH + spacingMm;
      }

      if (m1) sheetSleeves.push(m1);
      if (m2) sheetSleeves.push(m2);
      if (cuello) sheetCollars.push(cuello);
      for (const o of playerSet.otherPieces) sheetCollars.push(o);

      if (!currentSheet.playerNames.includes(playerSet.playerName)) {
        currentSheet.playerNames.push(playerSet.playerName);
      }
    }

    finalizeCurrentSheet();
  }

  // ==========================================
  // 3. ACOMODO CONTINUO INDUSTRIAL DE SHORTS
  // ==========================================
  if (shortPlayerList.length > 0) {
    let currentSheet = createNewSheet('SHORT');
    let shortRowX = sideMarginMm;
    let shortRowY = topMarginMm;
    let shortRowH = 0;

    for (const playerSet of shortPlayerList) {
      const pIzq = playerSet.pantaIzq;
      const pDer = playerSet.pantaDer;

      const wIzq = pIzq ? pIzq.bbox.width : 0;
      const hIzq = pIzq ? pIzq.bbox.height : 0;
      const wDer = pDer ? pDer.bbox.width : 0;
      const hDer = pDer ? pDer.bbox.height : 0;

      const pairW = (pIzq ? wIzq : 0) + (pIzq && pDer ? spacingMm : 0) + (pDer ? wDer : 0);
      const pairH = Math.max(hIzq, hDer);

      // Si el par no cabe en el ancho de la fila actual, saltar a la siguiente fila
      if (shortRowX > sideMarginMm && shortRowX + pairW + sideMarginMm > printableWidthMm) {
        shortRowY += shortRowH + spacingMm;
        shortRowX = sideMarginMm;
        shortRowH = 0;
      }

      // Particionado de pliego para Shorts
      if (shortRowY + pairH + topMarginMm > maxSheetLengthMm && currentSheet.placedPieces.length > 0) {
        currentSheet.heightMm = shortRowY + topMarginMm;
        currentSheet.fileName = `PARTE_${currentSheet.sheetNumber}_SHORTS_${printableWidthMm.toFixed(0)}x${currentSheet.heightMm.toFixed(0)}mm`;

        currentSheet = createNewSheet('SHORT');
        shortRowX = sideMarginMm;
        shortRowY = topMarginMm;
        shortRowH = 0;
      }

      if (pIzq) {
        const placedIzq: PlacedNestingPiece = {
          ...pIzq,
          xMm: Number(shortRowX.toFixed(2)),
          yMm: Number(shortRowY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: wIzq,
          effectiveHeightMm: hIzq,
          isLocked: false,
          sheetIndex: currentSheet.sheetNumber - 1,
        };
        currentSheet.placedPieces.push(placedIzq);
        allPlacedPieces.push(placedIzq);
        shortRowX += wIzq + spacingMm;
      }

      if (pDer) {
        const placedDer: PlacedNestingPiece = {
          ...pDer,
          xMm: Number(shortRowX.toFixed(2)),
          yMm: Number(shortRowY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: wDer,
          effectiveHeightMm: hDer,
          isLocked: false,
          sheetIndex: currentSheet.sheetNumber - 1,
        };
        currentSheet.placedPieces.push(placedDer);
        allPlacedPieces.push(placedDer);
        shortRowX += wDer + spacingMm;
      }

      shortRowH = Math.max(shortRowH, pairH);

      if (!currentSheet.playerNames.includes(playerSet.playerName)) {
        currentSheet.playerNames.push(playerSet.playerName);
      }
    }

    shortRowY += shortRowH + spacingMm;
    currentSheet.heightMm = Number((shortRowY + topMarginMm).toFixed(2));
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
