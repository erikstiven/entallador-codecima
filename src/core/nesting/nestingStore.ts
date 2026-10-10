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
  movePiece: (pieceId: string, xMm: number, yMm: number) => void;
  rotatePiece: (pieceId: string, degDelta?: number) => void;
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

    // Flyweight: Asegurar que svgContent no se duplique en el store ni se serialice al Web Worker
    const lightweightPieces: NestingPieceInput[] = pieces.map((p) => {
      const { svgContent, ...rest } = p;
      if (typeof svgContent === 'string' && svgContent.length > 0) {
        pieceSvgRegistry.set(p.id, svgContent);
      }
      return rest;
    });

    const options: NestingOptions = {
      printableWidthMm: customOptions.printableWidthMm ?? printableWidthMm,
      maxSheetLengthMm: customOptions.maxSheetLengthMm ?? maxSheetLengthMm,
      spacingMm: customOptions.spacingMm ?? spacingMm,
      groupingMode: customOptions.groupingMode ?? nestingMode,
      allowRotation: customOptions.allowRotation ?? false,
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
    if (!targetPiece) return;

    const clampedX = Number(Math.max(0, Math.min(xMm, printableWidthMm - targetPiece.effectiveWidthMm)).toFixed(2));
    const clampedY = Number(Math.max(0, yMm).toFixed(2));

    if (targetPiece.xMm === clampedX && targetPiece.yMm === clampedY && targetPiece.isLocked) {
      return;
    }

    const updatedPiece: PlacedNestingPiece = {
      ...targetPiece,
      xMm: clampedX,
      yMm: clampedY,
      isLocked: true,
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
  },

  rotatePiece: (pieceId, degDelta = 180) => {
    const { placedPieces, printableWidthMm, sheets, nestingResult } = get();
    const targetPiece = placedPieces.find((p) => p.id === pieceId);
    if (!targetPiece) return;

    const newRot = ((targetPiece.rotationDeg + degDelta) % 360 + 360) % 360;
    const isOrthogonal = newRot === 90 || newRot === 270;
    const effW = isOrthogonal ? targetPiece.bbox.height : targetPiece.bbox.width;
    const effH = isOrthogonal ? targetPiece.bbox.width : targetPiece.bbox.height;
    const clampedX = Math.max(0, Math.min(targetPiece.xMm, printableWidthMm - effW));

    const updatedPiece: PlacedNestingPiece = {
      ...targetPiece,
      rotationDeg: newRot,
      effectiveWidthMm: effW,
      effectiveHeightMm: effH,
      xMm: Number(clampedX.toFixed(2)),
      isLocked: true,
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
