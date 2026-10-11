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
    // Mangas y cuellos acumulados pendientes de acomodar en la base del pliego
    const sheetSleeves: NestingPieceInput[] = [];
    const sheetCollars: NestingPieceInput[] = [];

    /**
     * Llena el espacio sobrante horizontal a la derecha de una fila de camiseta con mangas.
     * Soporta 1 o 2 columnas paralelas y apilamiento vertical hasta rowH.
     */
    const fillRowSideZoneWithSleeves = (
      zoneX: number,
      zoneY: number,
      availableW: number,
      zoneH: number,
      sleevePool: NestingPieceInput[],
      sheetIdx: number
    ): PlacedNestingPiece[] => {
      const placed: PlacedNestingPiece[] = [];
      if (sleevePool.length === 0 || availableW <= 0 || zoneH <= 0) return placed;

      let sleeveToggle = 90;

      // 1. Probar doble columna si hay suficiente ancho para 2 mangas
      let canDoubleCol = false;
      if (sleevePool.length >= 2) {
        const sW1 = sleevePool[0].bbox.height;
        const sW2 = sleevePool[1].bbox.height;
        if (availableW >= sW1 + spacingMm + sW2) {
          canDoubleCol = true;
        }
      }

      if (canDoubleCol) {
        let currY = zoneY;
        while (sleevePool.length >= 2) {
          const m1 = sleevePool[0];
          const m2 = sleevePool[1];
          const sW1 = m1.bbox.height;
          const sH1 = m1.bbox.width;
          const sW2 = m2.bbox.height;
          const sH2 = m2.bbox.width;
          const pairH = Math.max(sH1, sH2);

          if (currY + pairH > zoneY + zoneH + 0.5) break;

          const col1X = Number(zoneX.toFixed(2));
          const col2X = Number((zoneX + sW1 + spacingMm).toFixed(2));

          placed.push(
            {
              ...m1,
              xMm: col1X,
              yMm: Number(currY.toFixed(2)),
              rotationDeg: 90,
              effectiveWidthMm: sW1,
              effectiveHeightMm: sH1,
              isLocked: false,
              sheetIndex: sheetIdx,
            },
            {
              ...m2,
              xMm: col2X,
              yMm: Number(currY.toFixed(2)),
              rotationDeg: 90,
              effectiveWidthMm: sW2,
              effectiveHeightMm: sH2,
              isLocked: false,
              sheetIndex: sheetIdx,
            }
          );

          currY += pairH + spacingMm;
          sleevePool.splice(0, 2);
        }
        return placed;
      }

      // 2. Columna simple (apilada verticalmente a la derecha)
      let currY = zoneY;
      while (sleevePool.length > 0) {
        const idx = sleevePool.findIndex(
          (m) => m.bbox.height <= availableW && currY + m.bbox.width <= zoneY + zoneH + 0.5
        );
        if (idx === -1) break;

        const m = sleevePool.splice(idx, 1)[0];
        const sW = m.bbox.height;
        const sH = m.bbox.width;

        placed.push({
          ...m,
          xMm: Number(zoneX.toFixed(2)),
          yMm: Number(currY.toFixed(2)),
          rotationDeg: sleeveToggle,
          effectiveWidthMm: sW,
          effectiveHeightMm: sH,
          isLocked: false,
          sheetIndex: sheetIdx,
        });

        currY += sH + spacingMm;
        sleeveToggle = sleeveToggle === 90 ? 270 : 90;
      }

      return placed;
    };

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

      // 2.3 Cuellos y piezas adicionales: empacar en la zona inferior a todo lo ancho
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

      const rowSleevesPool: NestingPieceInput[] = [];
      if (m1) rowSleevesPool.push(m1);
      if (m2) rowSleevesPool.push(m2);

      const pairWidth = sideMarginMm + wDel + (del && esp ? spacingMm : 0) + wEsp + sideMarginMm;
      const canFitBothInRow = del && esp && pairWidth <= printableWidthMm;

      if (canFitBothInRow || (del && !esp) || (!del && esp)) {
        const jerseyRowH = Math.max(hDel, hEsp);

        if (
          jerseyY + jerseyRowH + topMarginMm > maxSheetLengthMm &&
          (currentSheet.placedPieces.length > 0 || sheetSleeves.length > 0)
        ) {
          finalizeCurrentSheet();
          currentSheet = createNewSheet('CAMISETA');
          jerseyY = topMarginMm;
        }

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

        const espX = del ? Number((delX + wDel + spacingMm).toFixed(2)) : sideMarginMm;
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

        const rightEdge = (esp ? espX + wEsp : delX + wDel) + spacingMm;
        const availableRightWidth = printableWidthMm - rightEdge - sideMarginMm;

        const candidatePool = [...rowSleevesPool, ...sheetSleeves];
        sheetSleeves.length = 0;

        const placedRowSleeves = fillRowSideZoneWithSleeves(
          rightEdge,
          jerseyY,
          availableRightWidth,
          jerseyRowH,
          candidatePool,
          currentSheet.sheetNumber - 1
        );

        currentSheet.placedPieces.push(...placedRowSleeves);
        allPlacedPieces.push(...placedRowSleeves);
        sheetSleeves.push(...candidatePool);

        jerseyY += jerseyRowH + spacingMm;
      } else {
        if (del) {
          if (
            jerseyY + hDel + topMarginMm > maxSheetLengthMm &&
            (currentSheet.placedPieces.length > 0 || sheetSleeves.length > 0)
          ) {
            finalizeCurrentSheet();
            currentSheet = createNewSheet('CAMISETA');
            jerseyY = topMarginMm;
          }

          const placedDel: PlacedNestingPiece = {
            ...del,
            xMm: sideMarginMm,
            yMm: Number(jerseyY.toFixed(2)),
            rotationDeg: 0,
            effectiveWidthMm: wDel,
            effectiveHeightMm: hDel,
            isLocked: false,
            sheetIndex: currentSheet.sheetNumber - 1,
          };
          currentSheet.placedPieces.push(placedDel);
          allPlacedPieces.push(placedDel);

          const rightEdge = sideMarginMm + wDel + spacingMm;
          const availableRightWidth = printableWidthMm - rightEdge - sideMarginMm;

          const candidatePool = [...rowSleevesPool, ...sheetSleeves];
          sheetSleeves.length = 0;

          const placedRowSleeves = fillRowSideZoneWithSleeves(
            rightEdge,
            jerseyY,
            availableRightWidth,
            hDel,
            candidatePool,
            currentSheet.sheetNumber - 1
          );

          currentSheet.placedPieces.push(...placedRowSleeves);
          allPlacedPieces.push(...placedRowSleeves);
          sheetSleeves.push(...candidatePool);

          jerseyY += hDel + spacingMm;
        }

        if (esp) {
          if (
            jerseyY + hEsp + topMarginMm > maxSheetLengthMm &&
            (currentSheet.placedPieces.length > 0 || sheetSleeves.length > 0)
          ) {
            finalizeCurrentSheet();
            currentSheet = createNewSheet('CAMISETA');
            jerseyY = topMarginMm;
          }

          const placedEsp: PlacedNestingPiece = {
            ...esp,
            xMm: sideMarginMm,
            yMm: Number(jerseyY.toFixed(2)),
            rotationDeg: 0,
            effectiveWidthMm: wEsp,
            effectiveHeightMm: hEsp,
            isLocked: false,
            sheetIndex: currentSheet.sheetNumber - 1,
          };
          currentSheet.placedPieces.push(placedEsp);
          allPlacedPieces.push(placedEsp);

          const rightEdge = sideMarginMm + wEsp + spacingMm;
          const availableRightWidth = printableWidthMm - rightEdge - sideMarginMm;

          const candidatePool = [...sheetSleeves];
          sheetSleeves.length = 0;

          const placedRowSleeves = fillRowSideZoneWithSleeves(
            rightEdge,
            jerseyY,
            availableRightWidth,
            hEsp,
            candidatePool,
            currentSheet.sheetNumber - 1
          );

          currentSheet.placedPieces.push(...placedRowSleeves);
          allPlacedPieces.push(...placedRowSleeves);
          sheetSleeves.push(...candidatePool);

          jerseyY += hEsp + spacingMm;
        }
      }

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
