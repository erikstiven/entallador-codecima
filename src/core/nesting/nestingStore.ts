import { create } from 'zustand';
import { 
  NestingPieceInput, 
  PlacedNestingPiece, 
  NestingResult, 
  NestingGroupingMode,
  NestingOptions 
} from './types';
import { runNestingEngine } from './nestingEngine';
import { executePolygonalNestingWithWorker } from './worker/nestingWorkerClient';

export type NestingAlgorithm = 'POLYGONAL_CLIPPER2' | 'BOUNDING_BOX';

interface NestingState {
  placedPieces: PlacedNestingPiece[];
  nestingResult: NestingResult | null;
  isNesting: boolean;
  nestingProgress: number; // 0 to 100 %
  nestingMode: NestingGroupingMode;
  nestingAlgorithm: NestingAlgorithm;
  spacingMm: number;
  printableWidthMm: number;
  selectedPieceId: string | null;

  // Actions
  setNestingMode: (mode: NestingGroupingMode) => void;
  setNestingAlgorithm: (algo: NestingAlgorithm) => void;
  setSpacingMm: (spacing: number) => void;
  setPrintableWidthMm: (width: number) => void;
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
  isNesting: false,
  nestingProgress: 0,
  nestingMode: 'MAX_SAVINGS',
  nestingAlgorithm: 'POLYGONAL_CLIPPER2',
  spacingMm: 7.0,
  printableWidthMm: 1120.0,
  selectedPieceId: null,

  setNestingMode: (mode) => set({ nestingMode: mode }),
  setNestingAlgorithm: (algo) => set({ nestingAlgorithm: algo }),
  setSpacingMm: (spacing) => set({ spacingMm: spacing }),
  setPrintableWidthMm: (width) => set({ printableWidthMm: width }),
  setSelectedPieceId: (id) => set({ selectedPieceId: id }),

  runNesting: async (pieces, customOptions = {}) => {
    set({ isNesting: true, nestingProgress: 0 });
    const { nestingMode, spacingMm, printableWidthMm, nestingAlgorithm } = get();

    const options: NestingOptions = {
      printableWidthMm: customOptions.printableWidthMm ?? printableWidthMm,
      spacingMm: customOptions.spacingMm ?? spacingMm,
      groupingMode: customOptions.groupingMode ?? nestingMode,
      allowRotation: customOptions.allowRotation ?? true,
    };

    let result: NestingResult;

    if (nestingAlgorithm === 'POLYGONAL_CLIPPER2') {
      result = await executePolygonalNestingWithWorker(pieces, options, (progress) => {
        set({ nestingProgress: progress });
      });
    } else {
      result = runNestingEngine(pieces, options);
    }

    set({
      placedPieces: result.placedPieces,
      nestingResult: result,
      isNesting: false,
      nestingProgress: 100,
    });

    return result;
  },

  toggleLockPiece: (pieceId) => {
    const { placedPieces } = get();
    const updated = placedPieces.map((p) => {
      if (p.id === pieceId) {
        return { ...p, isLocked: !p.isLocked };
      }
      return p;
    });
    set({ placedPieces: updated });
  },

  movePiece: (pieceId, xMm, yMm) => {
    const { placedPieces, printableWidthMm } = get();
    const updated = placedPieces.map((p) => {
      if (p.id === pieceId) {
        const clampedX = Math.max(0, Math.min(xMm, printableWidthMm - p.effectiveWidthMm));
        const clampedY = Math.max(0, yMm);
        return {
          ...p,
          xMm: Number(clampedX.toFixed(2)),
          yMm: Number(clampedY.toFixed(2)),
          isLocked: true, // Mover manualmente bloquea automáticamente para preservar ajuste
        };
      }
      return p;
    });

    // Recalcular métricas de rollo
    let maxRollLength = 0;
    let totalArea = 0;
    for (const pl of updated) {
      const b = pl.yMm + pl.effectiveHeightMm;
      if (b > maxRollLength) maxRollLength = b;
      totalArea += pl.areaMm2;
    }

    const usedArea = printableWidthMm * maxRollLength;
    const utilization = usedArea > 0 ? (totalArea / usedArea) * 100 : 0;

    set((state) => ({
      placedPieces: updated,
      nestingResult: state.nestingResult
        ? {
            ...state.nestingResult,
            placedPieces: updated,
            totalRollLengthMm: Number(maxRollLength.toFixed(2)),
            usedRollAreaMm2: Number(usedArea.toFixed(2)),
            utilizationPercent: Number(utilization.toFixed(2)),
            wastePercent: Number((100 - utilization).toFixed(2)),
          }
        : null,
    }));
  },

  rotatePiece: (pieceId, degDelta = 180) => {
    const { placedPieces, printableWidthMm } = get();
    const updated = placedPieces.map((p) => {
      if (p.id === pieceId) {
        const allowed = p.allowedRotations || [0];
        const newRot = (p.rotationDeg + degDelta) % 360;
        if (!allowed.includes(newRot) && allowed.length > 0) {
          return p;
        }

        const isSwapped = newRot === 90 || newRot === 270;
        const effW = isSwapped ? p.bbox.height : p.bbox.width;
        const effH = isSwapped ? p.bbox.width : p.bbox.height;
        const clampedX = Math.max(0, Math.min(p.xMm, printableWidthMm - effW));

        return {
          ...p,
          rotationDeg: newRot,
          effectiveWidthMm: Number(effW.toFixed(2)),
          effectiveHeightMm: Number(effH.toFixed(2)),
          xMm: Number(clampedX.toFixed(2)),
          isLocked: true,
        };
      }
      return p;
    });

    set({ placedPieces: updated });
  },

  reoptimizeUnlocked: async (allPieces) => {
    const { placedPieces, nestingMode, spacingMm, printableWidthMm, nestingAlgorithm } = get();
    set({ isNesting: true, nestingProgress: 0 });

    const lockedMap = new Map<string, PlacedNestingPiece>();
    for (const pl of placedPieces) {
      if (pl.isLocked) {
        lockedMap.set(pl.id, pl);
      }
    }

    const inputPieces: NestingPieceInput[] = allPieces.map((p) => {
      const locked = lockedMap.get(p.id);
      if (locked) {
        return {
          ...p,
          isLocked: true,
          xMm: locked.xMm,
          yMm: locked.yMm,
          rotationDeg: locked.rotationDeg,
        };
      }
      return {
        ...p,
        isLocked: false,
      };
    });

    const options: NestingOptions = {
      printableWidthMm,
      spacingMm,
      groupingMode: nestingMode,
      allowRotation: true,
    };

    let result: NestingResult;

    if (nestingAlgorithm === 'POLYGONAL_CLIPPER2') {
      result = await executePolygonalNestingWithWorker(inputPieces, options, (progress) => {
        set({ nestingProgress: progress });
      });
    } else {
      result = runNestingEngine(inputPieces, options);
    }

    set({
      placedPieces: result.placedPieces,
      nestingResult: result,
      isNesting: false,
      nestingProgress: 100,
    });

    return result;
  },

  clearNesting: () => set({ placedPieces: [], nestingResult: null, selectedPieceId: null, nestingProgress: 0 }),
}));
