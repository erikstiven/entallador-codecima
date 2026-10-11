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
      const leftoverSleeves: NestingPieceInput[] = [];
      const leftoverCollars: NestingPieceInput[] = [];

      let jerseyY = topMarginMm;

      for (const playerSet of sheetPlayers) {
        if (!playerNames.includes(playerSet.playerName)) {
          playerNames.push(playerSet.playerName);
        }

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

        const pairWidth = sideMarginMm + wDel + (del && esp ? spacingMm : 0) + wEsp + sideMarginMm;
        const canFitBothInRow = del && esp && pairWidth <= printableWidthMm;

        // Pool de mangas candidatas para esta fila (mangas del jugador actual primero + sobrantes previos)
        const rowSleeves: NestingPieceInput[] = [];
        if (m1) rowSleeves.push(m1);
        if (m2) rowSleeves.push(m2);

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

          // Combinar mangas del jugador con sobrantes acumulados
          const candidatesToPlace = [...rowSleeves, ...leftoverSleeves];
          leftoverSleeves.length = 0;

          const collarsToPlace = [...rowCollars, ...leftoverCollars];
          leftoverCollars.length = 0;

          // Colocar mangas inmediatamente pegadas al borde derecho de esta fila
          let sleeveCurrY = jerseyY;
          let sleeveToggle = 90;

          // 1. Probar doble columna si hay suficiente ancho para 2 mangas
          let canFitDoubleCol = false;
          if (candidatesToPlace.length >= 2) {
            const sW1 = candidatesToPlace[0].bbox.height;
            const sW2 = candidatesToPlace[1].bbox.height;
            if (availableRightWidth >= sW1 + spacingMm + sW2) {
              canFitDoubleCol = true;
            }
          }

          if (canFitDoubleCol) {
            while (candidatesToPlace.length >= 2) {
              const sm1 = candidatesToPlace[0];
              const sm2 = candidatesToPlace[1];
              const sW1 = sm1.bbox.height;
              const sH1 = sm1.bbox.width;
              const sW2 = sm2.bbox.height;
              const sH2 = sm2.bbox.width;
              const pairH = Math.max(sH1, sH2);

              if (sW1 + spacingMm + sW2 > availableRightWidth) break;
              if (sleeveCurrY + pairH > jerseyY + jerseyRowH + 0.5) break;

              const col1X = Number(rowRightEdge.toFixed(2));
              const col2X = Number((rowRightEdge + sW1 + spacingMm).toFixed(2));

              placedPieces.push(
                {
                  ...sm1,
                  xMm: col1X,
                  yMm: Number(sleeveCurrY.toFixed(2)),
                  rotationDeg: 90,
                  effectiveWidthMm: sW1,
                  effectiveHeightMm: sH1,
                  isLocked: false,
                  sheetIndex: sheetIdx,
                },
                {
                  ...sm2,
                  xMm: col2X,
                  yMm: Number(sleeveCurrY.toFixed(2)),
                  rotationDeg: 90,
                  effectiveWidthMm: sW2,
                  effectiveHeightMm: sH2,
                  isLocked: false,
                  sheetIndex: sheetIdx,
                }
              );

              sleeveCurrY += pairH + spacingMm;
              candidatesToPlace.splice(0, 2);
            }
          } else {
            // Columna lateral pegada a la espalda (X = rowRightEdge)
            // Permitir que las mangas fluyan en la pista lateral sin detenerse artificialmente por la altura de fila individual
            while (candidatesToPlace.length > 0) {
              const sm = candidatesToPlace[0];
              const sW = sm.bbox.height;
              const sH = sm.bbox.width;

              if (sW > availableRightWidth) break;

              // Si ya superó el final de la fila actual, dejamos que continúe en la siguiente fila si hay espacio lateral
              if (sleeveCurrY + sH > jerseyY + jerseyRowH + 0.5) {
                break;
              }

              placedPieces.push({
                ...sm,
                xMm: Number(rowRightEdge.toFixed(2)),
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
          }

          // Relleno de huecos residuales con cuellos debajo de las mangas de esta fila
          const remainingGapH = (jerseyY + jerseyRowH) - sleeveCurrY;
          if (remainingGapH > 20 && collarsToPlace.length > 0) {
            let gapY = sleeveCurrY;
            while (collarsToPlace.length > 0) {
              const cIdx = collarsToPlace.findIndex(
                (c) => c.bbox.width <= availableRightWidth && gapY + c.bbox.height <= jerseyY + jerseyRowH + 0.5
              );
              if (cIdx === -1) break;

              const collar = collarsToPlace.splice(cIdx, 1)[0];
              placedPieces.push({
                ...collar,
                xMm: Number(rowRightEdge.toFixed(2)),
                yMm: Number(gapY.toFixed(2)),
                rotationDeg: 0,
                effectiveWidthMm: collar.bbox.width,
                effectiveHeightMm: collar.bbox.height,
                isLocked: false,
                sheetIndex: sheetIdx,
              });

              gapY += collar.bbox.height + spacingMm;
            }
          }

          // Si sobran mangas que no cupieron en esta fila, guardar para siguientes filas o la base
          leftoverSleeves.push(...candidatesToPlace);
          leftoverCollars.push(...collarsToPlace);

          jerseyY += jerseyRowH + spacingMm;
        } else {
          // --- Tallas adultas extra grandes que no caben juntas en ancho ---
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

            const rowRightEdge = sideMarginMm + wDel + spacingMm;
            const availableRightWidth = printableWidthMm - rowRightEdge - sideMarginMm;

            const candidatesToPlace = [...rowSleeves, ...leftoverSleeves];
            leftoverSleeves.length = 0;

            let sleeveCurrY = jerseyY;
            let sleeveToggle = 90;

            while (candidatesToPlace.length > 0) {
              const sm = candidatesToPlace[0];
              const sW = sm.bbox.height;
              const sH = sm.bbox.width;

              if (sW > availableRightWidth) break;
              if (sleeveCurrY + sH > jerseyY + hDel + 0.5) break;

              placedPieces.push({
                ...sm,
                xMm: Number(rowRightEdge.toFixed(2)),
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

            leftoverSleeves.push(...candidatesToPlace);
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

            const rowRightEdge = sideMarginMm + wEsp + spacingMm;
            const availableRightWidth = printableWidthMm - rowRightEdge - sideMarginMm;

            const candidatesToPlace = [...leftoverSleeves];
            leftoverSleeves.length = 0;

            let sleeveCurrY = jerseyY;
            let sleeveToggle = 90;

            while (candidatesToPlace.length > 0) {
              const sm = candidatesToPlace[0];
              const sW = sm.bbox.height;
              const sH = sm.bbox.width;

              if (sW > availableRightWidth) break;
              if (sleeveCurrY + sH > jerseyY + hEsp + 0.5) break;

              placedPieces.push({
                ...sm,
                xMm: Number(rowRightEdge.toFixed(2)),
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

            leftoverSleeves.push(...candidatesToPlace);
            jerseyY += hEsp + spacingMm;
          }

          if (cuello) leftoverCollars.push(cuello);
          for (const o of playerSet.otherPieces) leftoverCollars.push(o);
        }
      }

      const jerseyBottomY = jerseyY;

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

    // Particionado armonioso de pliegos de camisetas
    const playerBatches: PlayerGarmentSet[][] = [];
    let currentBatch: PlayerGarmentSet[] = [];

    for (const player of camisetaPlayerList) {
      if (currentBatch.length === 0) {
        currentBatch.push(player);
      } else {
        const candidate = [...currentBatch, player];
        const est = layoutCamisetaSheet(candidate, 0);
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
      const plan = layoutCamisetaSheet(batch, currentSheet.sheetNumber - 1);

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
