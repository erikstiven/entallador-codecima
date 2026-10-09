import {
  NestingPieceInput,
  PlacedNestingPiece,
  NestingOptions,
  NestingResult,
  NestingSheet,
} from './types';

const DEFAULT_PRINTABLE_WIDTH_MM = 1120.0;
const DEFAULT_MAX_SHEET_LENGTH_MM = 5000.0; // 5.0 metros
const DEFAULT_SPACING_MM = 6.0;
const DEFAULT_SIDE_MARGIN_MM = 5.0;
const DEFAULT_TOP_MARGIN_MM = 8.0;

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
    let mangaY = topMarginMm;

    // Calcular ancho máximo de delanteros y espaldas
    const maxDelanteroW = camisetaPlayerList.reduce((max, p) => Math.max(max, p.delantero?.bbox.width || 0), 0) || 400;
    const maxEspaldaW = camisetaPlayerList.reduce((max, p) => Math.max(max, p.espalda?.bbox.width || 0), 0) || 400;
    const shirtsBandWidth = sideMarginMm + maxDelanteroW + spacingMm + maxEspaldaW;

    const remainingSleeves: NestingPieceInput[] = [];
    const remainingCollars: NestingPieceInput[] = [];

    // Calcular altura total acumulada de camisetas en el lote
    const totalJerseysHeight = camisetaPlayerList.reduce(
      (sum, p) => sum + Math.max(p.delantero?.bbox.height || 0, p.espalda?.bbox.height || 0) + spacingMm,
      topMarginMm
    );

    const finalizeCurrentSheet = () => {
      let bottomY = Math.max(jerseyY, mangaY);
      let bottomX = sideMarginMm;
      let bottomRowH = 0;

      for (const sleeve of remainingSleeves) {
        const sW = sleeve.bbox.width;
        const sH = sleeve.bbox.height;

        if (bottomX + sW + sideMarginMm > printableWidthMm) {
          bottomY += bottomRowH + spacingMm;
          bottomX = sideMarginMm;
          bottomRowH = 0;
        }

        const placedSleeve: PlacedNestingPiece = {
          ...sleeve,
          xMm: Number(bottomX.toFixed(2)),
          yMm: Number(bottomY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: sW,
          effectiveHeightMm: sH,
          isLocked: false,
          sheetIndex: currentSheet.sheetNumber - 1,
        };
        currentSheet.placedPieces.push(placedSleeve);
        allPlacedPieces.push(placedSleeve);

        bottomX += sW + spacingMm;
        bottomRowH = Math.max(bottomRowH, sH);
      }
      if (bottomRowH > 0) {
        bottomY += bottomRowH + spacingMm;
      }

      // Empacar cuellos en fila horizontal
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

        const placedCollar: PlacedNestingPiece = {
          ...collar,
          xMm: Number(collarX.toFixed(2)),
          yMm: Number(bottomY.toFixed(2)),
          rotationDeg: 0,
          effectiveWidthMm: cW,
          effectiveHeightMm: cH,
          isLocked: false,
          sheetIndex: currentSheet.sheetNumber - 1,
        };
        currentSheet.placedPieces.push(placedCollar);
        allPlacedPieces.push(placedCollar);

        collarX += cW + spacingMm;
        collarRowH = Math.max(collarRowH, cH);
      }
      if (collarRowH > 0) {
        bottomY += collarRowH + spacingMm;
      }

      currentSheet.heightMm = Number((bottomY + topMarginMm).toFixed(2));
      currentSheet.fileName = `PARTE_${currentSheet.sheetNumber}_CAMISETAS_${printableWidthMm.toFixed(0)}x${currentSheet.heightMm.toFixed(0)}mm`;

      remainingSleeves.length = 0;
      remainingCollars.length = 0;
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

      // Particionado de pliego
      if (jerseyY + jerseyRowH + topMarginMm > maxSheetLengthMm && currentSheet.placedPieces.length > 0) {
        finalizeCurrentSheet();
        currentSheet = createNewSheet('CAMISETA');
        jerseyY = topMarginMm;
        mangaY = topMarginMm;
      }

      // 1. Colocar Frente
      if (del) {
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
      }

      // 2. Colocar Espalda
      if (esp) {
        const espX = Number((sideMarginMm + (del ? wDel : maxDelanteroW) + spacingMm).toFixed(2));
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

      // 3. Colocar Mangas en la columna derecha MIENTRAS no sobrepasen excesivamente el lote de camisetas
      const mangaX = Number((shirtsBandWidth + spacingMm).toFixed(2));

      const placeOrQueueSleeve = (sleeve: NestingPieceInput) => {
        const sW = sleeve.bbox.height; // rot 90
        const sH = sleeve.bbox.width;
        // Cabe en la columna derecha dentro del pliego y a lo largo del flujo de camisetas
        const maxAllowedY = Math.min(
          maxSheetLengthMm - topMarginMm - sH,
          Math.max(totalJerseysHeight, 650) + 150
        );
        if (mangaY + sH <= maxAllowedY) {
          const placedSleeve: PlacedNestingPiece = {
            ...sleeve,
            xMm: mangaX,
            yMm: Number(mangaY.toFixed(2)),
            rotationDeg: 90,
            effectiveWidthMm: sW,
            effectiveHeightMm: sH,
            isLocked: false,
            sheetIndex: currentSheet.sheetNumber - 1,
          };
          currentSheet.placedPieces.push(placedSleeve);
          allPlacedPieces.push(placedSleeve);
          mangaY += sH + spacingMm;
        } else {
          remainingSleeves.push(sleeve);
        }
      };

      if (m1) placeOrQueueSleeve(m1);
      if (m2) placeOrQueueSleeve(m2);
      if (cuello) remainingCollars.push(cuello);
      for (const o of playerSet.otherPieces) remainingCollars.push(o);

      if (!currentSheet.playerNames.includes(playerSet.playerName)) {
        currentSheet.playerNames.push(playerSet.playerName);
      }

      jerseyY += jerseyRowH + spacingMm;
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
