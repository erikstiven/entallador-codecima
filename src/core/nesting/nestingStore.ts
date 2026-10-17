import { create } from 'zustand';
import { 
  NestingPieceInput, 
  PlacedNestingPiece, 
  NestingResult, 
  NestingGroupingMode,
  NestingOptions,
  NestingSheet
} from './types';
import { executeNestingWithWorker, terminateActiveNestingWorkers } from './worker/nestingWorkerClient';
import { recordOptimizationRun } from './nestingLearningService';
import { pieceSvgRegistry } from '@/modules/generator/garmentGenerator';
import { validateManualPlacement } from './placementValidation';

export type NestingAlgorithm = 'MODULAR_INDUSTRIAL' | 'POLYGONAL_CLIPPER2' | 'BOUNDING_BOX';

let currentRunId = 0;

interface NestingState {
  placedPieces: PlacedNestingPiece[];
  nestingResult: NestingResult | null;
  sheets: NestingSheet[];
  activeSheetIndex: number;
  isNesting: boolean;
  nestingProgress: number; // 0 to 100 %
  nestingMode: NestingGroupingMode;
  nestingAlgorithm: NestingAlgorithm;
  spacingMm: number;
  printableWidthMm: number;
  maxSheetLengthMm: number;
  selectedPieceId: string | null;

  // Actions
  setNestingMode: (mode: NestingGroupingMode) => void;
  setNestingAlgorithm: (algo: NestingAlgorithm) => void;
  setSpacingMm: (spacing: number) => void;
  setPrintableWidthMm: (width: number) => void;
  setMaxSheetLengthMm: (lengthMm: number) => void;
  setActiveSheetIndex: (index: number) => void;
  setSelectedPieceId: (id: string | null) => void;
  
  runNesting: (pieces: NestingPieceInput[], customOptions?: Partial<NestingOptions>) => Promise<NestingResult>;
  toggleLockPiece: (pieceId: string) => void;
  movePiece: (pieceId: string, xMm: number, yMm: number) => boolean;
  rotatePiece: (pieceId: string, degDelta?: number) => boolean;
  reoptimizeUnlocked: (allPieces: NestingPieceInput[]) => Promise<NestingResult>;
  clearNesting: () => void;
}

export const useNestingStore = create<NestingState>((set, get) => ({
  placedPieces: [],
  nestingResult: null,
  sheets: [],
  activeSheetIndex: 0,
  isNesting: false,
  nestingProgress: 0,
  nestingMode: 'MODULAR_PLAYER',
  nestingAlgorithm: 'MODULAR_INDUSTRIAL',
  spacingMm: 3.0,
  printableWidthMm: 1120.0,
  maxSheetLengthMm: 5000.0, // 5.0 metros estándar industrial
  selectedPieceId: null,

  setNestingMode: (mode) => set({ nestingMode: mode }),
  setNestingAlgorithm: (algo) => set({ nestingAlgorithm: algo }),
  setSpacingMm: (spacing) => set({ spacingMm: spacing }),
  setPrintableWidthMm: (width) => set({ printableWidthMm: width }),
  setMaxSheetLengthMm: (lengthMm) => set({ maxSheetLengthMm: lengthMm }),
  setActiveSheetIndex: (index) => set({ activeSheetIndex: index }),
  setSelectedPieceId: (id) => set({ selectedPieceId: id }),

  runNesting: async (pieces, customOptions = {}) => {
    const runId = ++currentRunId;
    terminateActiveNestingWorkers();
    set({ isNesting: true, nestingProgress: 0 });
    const { nestingMode, nestingAlgorithm, spacingMm, printableWidthMm, maxSheetLengthMm } = get();

    // Flyweight: Mapear explícitamente los campos geométricos para el Web Worker.
    // Solo si svgContent es una propiedad propia de valor (tests o piezas con SVG directo),
    // se transfiere al registro. Si es un getter calculado de GeneratedPiece, NO se evalúa
    // para evitar instanciar cientos de MB de cadenas SVG crudas en memoria.
    const lightweightPieces: NestingPieceInput[] = pieces.map((p) => {
      const pAny = p as any;
      const desc = Object.getOwnPropertyDescriptor(p, 'svgContent');
      if (desc && !desc.get && typeof desc.value === 'string' && desc.value.length > 0) {
        pieceSvgRegistry.set(p.id, desc.value);
      }

      return {
        id: p.id,
        orderItemId: p.orderItemId,
        pieceId: p.pieceId,
        playerName: p.playerName,
        playerNumber: p.playerNumber,
        sizeName: p.sizeName,
        pieceType: p.pieceType,
        bbox: {
          width: p.bbox.width,
          height: p.bbox.height,
        },
        areaMm2: p.areaMm2,
        allowedRotations: pAny.allowedRotations ?? pAny.allowedRotationsDeg ?? (
          p.pieceType.toUpperCase().startsWith('SHORT') || p.pieceType.toUpperCase().startsWith('PANTALONETA')
            ? [0, 90, 180, 270]
            : [0]
        ),
        cutPolygon: p.cutPolygon,
        isLocked: pAny.isLocked,
        xMm: pAny.xMm,
        yMm: pAny.yMm,
        rotationDeg: pAny.rotationDeg,
      };
    });

    const options: NestingOptions = {
      printableWidthMm: customOptions.printableWidthMm ?? printableWidthMm,
      maxSheetLengthMm: customOptions.maxSheetLengthMm ?? maxSheetLengthMm,
      spacingMm: customOptions.spacingMm ?? spacingMm,
      groupingMode: customOptions.groupingMode ?? nestingMode,
      allowRotation: customOptions.allowRotation ?? true,
    };

    const result = await executeNestingWithWorker(
      lightweightPieces,
      options,
      nestingAlgorithm,
      (progress) => {
        if (runId === currentRunId) {
          set({ nestingProgress: progress });
        }
      }
    );

    if (runId !== currentRunId) {
      return get().nestingResult || result;
    }

    const placedPieces = result.placedPieces;
    const sheets = result.sheets || [];
    if (!result.sheets) {
      result.sheets = sheets;
    }

    try {
      recordOptimizationRun(result, {
        printableWidthMm: options.printableWidthMm,
        spacingMm: options.spacingMm,
      });
    } catch {
      // No bloquear flujo por telemetría de aprendizaje
    }

    set({
      placedPieces,
      sheets,
      activeSheetIndex: 0,
      nestingResult: result,
      isNesting: false,
      nestingProgress: 100,
    });

    return result;
  },

  toggleLockPiece: (pieceId) => {
    const { placedPieces, sheets, nestingResult } = get();
    const targetPiece = placedPieces.find((p) => p.id === pieceId);
    if (!targetPiece) return;

    const updatedPiece: PlacedNestingPiece = {
      ...targetPiece,
      isLocked: !targetPiece.isLocked,
    };

    const updatedPlacedPieces = placedPieces.map((p) => (p.id === pieceId ? updatedPiece : p));

    const updatedSheets = sheets.map((sheet) => {
      const idx = sheet.placedPieces.findIndex((p) => p.id === pieceId);
      if (idx === -1) return sheet;
      const newSheetPieces = [...sheet.placedPieces];
      newSheetPieces[idx] = updatedPiece;
      return {
        ...sheet,
        placedPieces: newSheetPieces,
      };
    });

    set({
      placedPieces: updatedPlacedPieces,
      sheets: updatedSheets,
      nestingResult: nestingResult
        ? {
            ...nestingResult,
            placedPieces: updatedPlacedPieces,
            sheets: updatedSheets,
          }
        : null,
    });
  },

  movePiece: (pieceId, xMm, yMm) => {
    const { placedPieces, printableWidthMm, sheets, nestingResult } = get();
    const targetPiece = placedPieces.find((p) => p.id === pieceId);
    if (!targetPiece) return false;

    const clampedX = Number(Math.max(0, Math.min(xMm, printableWidthMm - targetPiece.effectiveWidthMm)).toFixed(2));
    const clampedY = Number(Math.max(0, yMm).toFixed(2));

    if (targetPiece.xMm === clampedX && targetPiece.yMm === clampedY && targetPiece.isLocked) {
      return true;
    }

    const updatedPiece: PlacedNestingPiece = {
      ...targetPiece,
      xMm: clampedX,
      yMm: clampedY,
      isLocked: true,
    };

    if (!validateManualPlacement(
      updatedPiece,
      placedPieces,
      printableWidthMm,
      get().spacingMm
    ).valid) return false;

    const updatedPlacedPieces = placedPieces.map((p) => (p.id === pieceId ? updatedPiece : p));

    const updatedSheets = sheets.map((sheet) => {
      const idx = sheet.placedPieces.findIndex((p) => p.id === pieceId);
      if (idx === -1) return sheet;
      const newSheetPieces = [...sheet.placedPieces];
      newSheetPieces[idx] = updatedPiece;
      return {
        ...sheet,
        placedPieces: newSheetPieces,
      };
    });

    // Recalcular métricas livianas sin recrear objetos pesados
    let maxRollLength = 0;
    let totalArea = 0;
    for (const pl of updatedPlacedPieces) {
      const b = pl.yMm + pl.effectiveHeightMm;
      if (b > maxRollLength) maxRollLength = b;
      totalArea += pl.areaMm2;
    }

    const usedArea = printableWidthMm * maxRollLength;
    const utilization = usedArea > 0 ? (totalArea / usedArea) * 100 : 0;

    const updatedResult: NestingResult | null = nestingResult
      ? {
          ...nestingResult,
          placedPieces: updatedPlacedPieces,
          sheets: updatedSheets,
          totalRollLengthMm: Number(maxRollLength.toFixed(2)),
          usedRollAreaMm2: Number(usedArea.toFixed(2)),
          utilizationPercent: Number(utilization.toFixed(2)),
          wastePercent: Number((100 - utilization).toFixed(2)),
        }
      : null;

    set({
      placedPieces: updatedPlacedPieces,
      sheets: updatedSheets,
      nestingResult: updatedResult,
    });
    return true;
  },

  rotatePiece: (pieceId, degDelta = 90) => {
    const { placedPieces, printableWidthMm, sheets, nestingResult } = get();
    const targetPiece = placedPieces.find((p) => p.id === pieceId);
    if (!targetPiece) return false;

    const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;
    const declaredRotations = targetPiece.allowedRotations
      .map(normalizeRotation)
      .filter((rotation, index, rotations) => rotations.indexOf(rotation) === index);
    const allowedRotations = targetPiece.pieceType.toUpperCase().startsWith('MANGA')
      ? [0, 90, 180, 270]
      : declaredRotations.length > 0
        ? declaredRotations
        : [normalizeRotation(targetPiece.rotationDeg)];
    const requestedRotation = normalizeRotation(targetPiece.rotationDeg + degDelta);
    const clockwiseRotations = [...allowedRotations].sort((a, b) => a - b);
    const newRot = allowedRotations.includes(requestedRotation)
      ? requestedRotation
      : clockwiseRotations.find((rotation) => rotation > normalizeRotation(targetPiece.rotationDeg))
        ?? clockwiseRotations[0];
    if (newRot === normalizeRotation(targetPiece.rotationDeg)) return false;

    const isOrthogonal = newRot === 90 || newRot === 270;
    const effW = isOrthogonal ? targetPiece.bbox.height : targetPiece.bbox.width;
    const effH = isOrthogonal ? targetPiece.bbox.width : targetPiece.bbox.height;
    const centerX = targetPiece.xMm + targetPiece.effectiveWidthMm / 2;
    const centerY = targetPiece.yMm + targetPiece.effectiveHeightMm / 2;
    const clampedX = Math.max(0, Math.min(centerX - effW / 2, printableWidthMm - effW));
    const clampedY = Math.max(0, centerY - effH / 2);

    const updatedPiece: PlacedNestingPiece = {
      ...targetPiece,
      rotationDeg: newRot,
      effectiveWidthMm: effW,
      effectiveHeightMm: effH,
      xMm: Number(clampedX.toFixed(2)),
      yMm: Number(clampedY.toFixed(2)),
      isLocked: true,
    };

    if (!validateManualPlacement(
      updatedPiece,
      placedPieces,
      printableWidthMm,
      get().spacingMm
    ).valid) return false;

    const updatedPlacedPieces = placedPieces.map((p) => (p.id === pieceId ? updatedPiece : p));

    const updatedSheets = sheets.map((sheet) => {
      const idx = sheet.placedPieces.findIndex((p) => p.id === pieceId);
      if (idx === -1) return sheet;
      const newSheetPieces = [...sheet.placedPieces];
      newSheetPieces[idx] = updatedPiece;
      return {
        ...sheet,
        placedPieces: newSheetPieces,
      };
    });

    let maxRollLength = 0;
    let totalArea = 0;
    for (const piece of updatedPlacedPieces) {
      maxRollLength = Math.max(maxRollLength, piece.yMm + piece.effectiveHeightMm);
      totalArea += piece.areaMm2;
    }
    const usedArea = printableWidthMm * maxRollLength;
    const utilization = usedArea > 0 ? (totalArea / usedArea) * 100 : 0;

    set({
      placedPieces: updatedPlacedPieces,
      sheets: updatedSheets,
      nestingResult: nestingResult
        ? {
            ...nestingResult,
            placedPieces: updatedPlacedPieces,
            sheets: updatedSheets,
            totalRollLengthMm: Number(maxRollLength.toFixed(2)),
            usedRollAreaMm2: Number(usedArea.toFixed(2)),
            utilizationPercent: Number(utilization.toFixed(2)),
            wastePercent: Number((100 - utilization).toFixed(2)),
          }
        : null,
    });
    return true;
  },

  reoptimizeUnlocked: async (allPieces) => {
    const { placedPieces, runNesting } = get();
    const lockedById = new Map(
      placedPieces.filter((p) => p.isLocked).map((p) => [p.id, p])
    );
    const mergedPieces: NestingPieceInput[] = allPieces.map((p) => {
      const existing = lockedById.get(p.id);
      if (existing) {
        return {
          ...p,
          isLocked: true,
          xMm: existing.xMm,
          yMm: existing.yMm,
          rotationDeg: existing.rotationDeg,
        };
      }
      return p;
    });
    return runNesting(mergedPieces);
  },

  clearNesting: () => {
    ++currentRunId;
    terminateActiveNestingWorkers();
    set({
      placedPieces: [],
      sheets: [],
      activeSheetIndex: 0,
      nestingResult: null,
      isNesting: false,
      nestingProgress: 0,
      selectedPieceId: null,
    });
  },
}));
