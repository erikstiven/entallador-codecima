import { create } from 'zustand';
import { 
  GeneratedPiece, 
  GenerationConfig, 
  GenerationResult 
} from './types';
import { 
  generateGarmentPieces, 
  filterReprintPieces,
  pieceSvgRegistry,
  getPieceSvgContent,
  setPieceSvgContent,
  resolvePieceSvg,
  getPieceMoldPath,
  clearPieceSvgRegistry,
  clearGeneratorCaches,
} from './garmentGenerator';

export {
  pieceSvgRegistry,
  getPieceSvgContent,
  setPieceSvgContent,
  resolvePieceSvg,
  getPieceMoldPath,
  clearPieceSvgRegistry,
  clearGeneratorCaches,
};
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
  setProductionScope: (scope: 'ALL' | 'CAMISETA_ONLY' | 'SHORT_ONLY') => GenerationResult | null;
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
    includeSizeMark: false,
    sizeMarkColor: '#000000',
    sizeMarkFontSizeMm: 8,
    sizeMarkBottomOffsetMm: 8,
    sleeveArtOffsetYMm: 0,
    frontArtOffsetYMm: 0,
    backArtOffsetYMm: 0,
    shortArtOffsetYMm: 0,
    includeShortNumber: true,
    shortNumberPiece: 'DER',
    shortNumberXPercent: 50,
    shortNumberYPercent: 45,
    shortNumberScale: 1,
    includeFrontNumber: false,
    frontNumberPosition: 'CENTRO',
    frontNumberXPercent: 50,
    frontNumberYPercent: 38,
    frontNumberScale: 1,
  },

  updateConfig: (updates) => {
    set((state) => ({
      generationConfig: { ...state.generationConfig, ...updates },
    }));
    if (get().generatedPieces.length > 0) {
      return get().generatePieces();
    }
  },

  setProductionScope: (scope) => {
    set((state) => ({
      generationConfig: { ...state.generationConfig, productionScope: scope },
    }));
    return get().generatePieces();
  },

  generatePieces: () => {
    const { items: orderItems } = useOrderStore.getState();
    const { activePatternSet } = usePatternStore.getState();
    const { activeDesign } = useDesignStore.getState();
    const { generationConfig } = get();

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

    // Auto-vinculación inteligente: si el pedido incluye pantalonetas y el molde activo no las tiene,
    // buscar en la biblioteca un molde complementario que sí tenga piezas de pantaloneta y unificarlas
    const allPatternSets = usePatternStore.getState().patternSets;
    const orderNeedsShorts = orderItems.some(
      (it) => it.isValid && (it.garmentType === 'SHORT' || it.garmentType === 'COMPLETO')
    ) && generationConfig.productionScope !== 'CAMISETA_ONLY';
    const patternHasShorts = patternSet.sizes.some((sz) =>
      sz.pieces.some((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'))
    );

    if (orderNeedsShorts && !patternHasShorts && allPatternSets.length > 1) {
      const partnerSet = allPatternSets.find(
        (ps) =>
          ps.id !== patternSet.id &&
          ps.sizes.some((sz) =>
            sz.pieces.some((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'))
          )
      );
      if (partnerSet) {
        patternSet = {
          ...patternSet,
          sizes: patternSet.sizes.map((sz) => {
            const matchingPartnerSize = partnerSet.sizes.find(
              (psz) => psz.sizeName.toUpperCase() === sz.sizeName.toUpperCase()
            );
            if (!matchingPartnerSize) return sz;
            const partnerShortPieces = matchingPartnerSize.pieces.filter(
              (p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT')
            );
            const existingIds = new Set(sz.pieces.map((p) => p.id));
            const piecesToAdd = partnerShortPieces.filter((p) => !existingIds.has(p.id));
            return {
              ...sz,
              pieces: [...sz.pieces, ...piecesToAdd],
            };
          }),
        };
      }
    }

    // Auto-vinculación inversa: si el pedido incluye camisetas y el molde activo no las tiene
    const orderNeedsCamiseta = orderItems.some(
      (it) => it.isValid && (it.garmentType === 'CAMISETA' || it.garmentType === 'COMPLETO')
    ) && generationConfig.productionScope !== 'SHORT_ONLY';
    const patternHasCamiseta = patternSet.sizes.some((sz) =>
      sz.pieces.some((p) => p.pieceType.startsWith('DELANTERO') || p.pieceType === 'ESPALDA')
    );

    if (orderNeedsCamiseta && !patternHasCamiseta && allPatternSets.length > 1) {
      const partnerCamisetaSet = allPatternSets.find(
        (ps) =>
          ps.id !== patternSet.id &&
          ps.sizes.some((sz) =>
            sz.pieces.some((p) => p.pieceType.startsWith('DELANTERO') || p.pieceType === 'ESPALDA')
          )
      );
      if (partnerCamisetaSet) {
        patternSet = {
          ...patternSet,
          sizes: patternSet.sizes.map((sz) => {
            const matchingPartnerSize = partnerCamisetaSet.sizes.find(
              (psz) => psz.sizeName.toUpperCase() === sz.sizeName.toUpperCase()
            );
            if (!matchingPartnerSize) return sz;
            const partnerCamisetaPieces = matchingPartnerSize.pieces.filter(
              (p) => !p.pieceType.startsWith('PANTALONETA') && !p.pieceType.startsWith('SHORT')
            );
            const existingIds = new Set(sz.pieces.map((p) => p.id));
            const piecesToAdd = partnerCamisetaPieces.filter((p) => !existingIds.has(p.id));
            return {
              ...sz,
              pieces: [...sz.pieces, ...piecesToAdd],
            };
          }),
        };
      }
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
    clearPieceSvgRegistry();
    set({
      generatedPieces: [],
      generationResult: null,
    });
  },
}));
