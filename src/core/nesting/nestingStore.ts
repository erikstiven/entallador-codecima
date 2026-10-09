import { create } from 'zustand';
import { 
  NestingPieceInput, 
  PlacedNestingPiece, 
  NestingResult, 
  NestingGroupingMode,
  NestingOptions,
  NestingSheet
} from './types';
import { runNestingEngine } from './nestingEngine';
import { performModularNesting } from './modularNestingEngine';

export type NestingAlgorithm = 'MODULAR_INDUSTRIAL' | 'POLYGONAL_CLIPPER2' | 'BOUNDING_BOX';

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
  spacingMm: 6.0,
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
    set({ isNesting: true, nestingProgress: 0 });
    const { nestingMode, spacingMm, printableWidthMm, maxSheetLengthMm } = get();

    const options: NestingOptions = {
      printableWidthMm: customOptions.printableWidthMm ?? printableWidthMm,
      maxSheetLengthMm: customOptions.maxSheetLengthMm ?? maxSheetLengthMm,
      spacingMm: customOptions.spacingMm ?? spacingMm,
      groupingMode: customOptions.groupingMode ?? nestingMode,
      allowRotation: customOptions.allowRotation ?? false,
    };

    let result: NestingResult;

    try {
      result = performModularNesting(pieces, options);
    } catch (err) {
      console.warn('Error en algoritmo modular, ejecutando motor de respaldo:', err);
      result = runNestingEngine(pieces, options);
    }

    set({
      placedPieces: result.placedPieces,
      sheets: result.sheets || [],
      activeSheetIndex: 0,
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
          isLocked: true,
        };
      }
      return p;
    });

    // Recalcular métricas
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
        const newRot = ((p.rotationDeg + degDelta) % 360 + 360) % 360;
        const isOrthogonal = newRot === 90 || newRot === 270;
        const effW = isOrthogonal ? p.bbox.height : p.bbox.width;
        const effH = isOrthogonal ? p.bbox.width : p.bbox.height;
        const clampedX = Math.max(0, Math.min(p.xMm, printableWidthMm - effW));

        return {
          ...p,
          rotationDeg: newRot,
          effectiveWidthMm: effW,
          effectiveHeightMm: effH,
          xMm: Number(clampedX.toFixed(2)),
          isLocked: true,
        };
      }
      return p;
    });

    set({ placedPieces: updated });
  },

  reoptimizeUnlocked: async (allPieces) => {
    const { runNesting } = get();
    return runNesting(allPieces);
  },

  clearNesting: () => {
    set({
      placedPieces: [],
      sheets: [],
      activeSheetIndex: 0,
      nestingResult: null,
      selectedPieceId: null,
    });
  },
}));
