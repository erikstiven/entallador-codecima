import { create } from 'zustand';
import { 
  GeneratedPiece, 
  GenerationConfig, 
  GenerationResult 
} from './types';
import { generateGarmentPieces, filterReprintPieces } from './garmentGenerator';
import { useOrderStore } from '@/modules/orders/orderStore';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { useDesignStore } from '@/modules/designs/designStore';
import { PieceType } from '@/core/geometry/types';

interface GeneratorStoreState {
  generatedPieces: GeneratedPiece[];
  generationResult: GenerationResult | null;
  isGenerating: boolean;
  generationConfig: GenerationConfig;

  updateConfig: (updates: Partial<GenerationConfig>) => void;
  generatePieces: () => GenerationResult | null;
  getReprintPieces: (filter: { playerName?: string; sizeName?: string; pieceType?: PieceType }) => GeneratedPiece[];
  clearGenerated: () => void;
}

export const useGeneratorStore = create<GeneratorStoreState>((set, get) => ({
  generatedPieces: [],
  generationResult: null,
  isGenerating: false,
  generationConfig: {
    includeLabels: true,
    labelDistanceMm: 6.0,
    labelFontSizeMm: 5.0,
    labelColor: '#94a3b8',
  },

  updateConfig: (updates) => {
    set((state) => ({
      generationConfig: { ...state.generationConfig, ...updates },
    }));
  },

  generatePieces: () => {
    const { items: orderItems } = useOrderStore.getState();
    let patternSet = activePatternSet || usePatternStore.getState().patternSets[0];
    if (!patternSet) {
      usePatternStore.getState().loadFromDatabase();
      patternSet = usePatternStore.getState().activePatternSet || usePatternStore.getState().patternSets[0];
    }

    let design = activeDesign || useDesignStore.getState().designs[0];
    if (!design) {
      useDesignStore.getState().loadDesignsFromDatabase();
      design = useDesignStore.getState().activeDesign || useDesignStore.getState().designs[0];
    }

    if (!patternSet) {
      console.warn('No hay conjunto de moldes activo para la generación.');
      return null;
    }

    if (!design) {
      console.warn('No hay diseño maestro activo para la generación.');
      return null;
    }

    if (orderItems.length === 0) {
      console.warn('No hay jugadores en la nómina para generar.');
      return null;
    }

    set({ isGenerating: true });

    try {
      const result = generateGarmentPieces(
        orderItems,
        patternSet,
        design,
        generationConfig
      );

      set({
        generatedPieces: result.pieces,
        generationResult: result,
        isGenerating: false,
      });

      return result;
    } catch (err) {
      console.error('Error generando prendas:', err);
      set({ isGenerating: false });
      return null;
    }
  },

  getReprintPieces: (filter) => {
    const { generatedPieces } = get();
    return filterReprintPieces(generatedPieces, filter);
  },

  clearGenerated: () => {
    set({
      generatedPieces: [],
      generationResult: null,
    });
  },
}));
