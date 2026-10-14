import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  OrderItem, 
  OrderSummary, 
  OrderValidationConfig,
  GarmentType,
  NecklineType
} from './types';
import { 
  parseExcelBuffer 
} from './excelParser';
import { 
  validateOrderList, 
  calculateOrderSummary 
} from './orderValidator';

interface OrderState {
  items: OrderItem[];
  summary: OrderSummary;
  clientName: string;
  teamName: string;
  sport: string;
  fileName: string | null;
  availableSizes: string[];
  strictNumberUniqueness: boolean;
  activePatternSet: any | null;
  activeDesign: any | null;

  // Actions
  setClientName: (name: string) => void;
  setTeamName: (team: string) => void;
  setSport: (sport: string) => void;
  setAvailableSizes: (sizes: string[]) => void;
  setStrictNumberUniqueness: (strict: boolean) => void;
  setValidationContext: (context: { activePatternSet?: any; activeDesign?: any }) => void;
  setAllGarmentTypes: (garmentType: GarmentType) => void;
  setAllNecklineTypes: (necklineType: NecklineType) => void;
  applyMassEdit: (options: {
    garmentType?: GarmentType;
    necklineType?: NecklineType;
    sizeName?: string;
    quantity?: number;
  }) => void;
  
  loadFromBuffer: (buffer: ArrayBuffer | Uint8Array, fileName: string) => void;
  updateItem: (id: string, updates: Partial<OrderItem>) => void;
  removeItem: (id: string) => void;
  addItem: (item: Partial<OrderItem>) => void;
  clearOrder: () => void;
}

const DEFAULT_AVAILABLE_SIZES = ['26', '28', '30', '32', '34', 'S', 'M', 'L', 'XL', 'XXL'];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
  items: [],
  summary: calculateOrderSummary([]),
  clientName: '',
  teamName: '',
  sport: 'FUTBOL',
  fileName: null,
  availableSizes: DEFAULT_AVAILABLE_SIZES,
  strictNumberUniqueness: false,
  activePatternSet: null,
  activeDesign: null,

  setClientName: (clientName) => set({ clientName }),
  setTeamName: (teamName) => set({ teamName }),
  setSport: (sport) => set({ sport }),
  
  setValidationContext: ({ activePatternSet, activeDesign }) => {
    const nextPattern = activePatternSet !== undefined ? activePatternSet : get().activePatternSet;
    const nextDesign = activeDesign !== undefined ? activeDesign : get().activeDesign;
    let nextSizes = get().availableSizes;
    if (nextPattern && nextPattern.sizes && nextPattern.sizes.length > 0) {
      nextSizes = nextPattern.sizes.map((s: any) => s.sizeName);
    }
    const { items, strictNumberUniqueness } = get();
    const validated = validateOrderList(items, {
      availableSizes: nextSizes,
      strictNumberUniqueness,
      activePatternSet: nextPattern,
      activeDesign: nextDesign,
    });
    set({
      activePatternSet: nextPattern,
      activeDesign: nextDesign,
      availableSizes: nextSizes,
      items: validated,
      summary: calculateOrderSummary(validated),
    });
  },

  setAvailableSizes: (sizes) => {
    set({ availableSizes: sizes });
    const { items, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const validated = validateOrderList(items, {
      availableSizes: sizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  setStrictNumberUniqueness: (strict) => {
    set({ strictNumberUniqueness: strict });
    const { items, availableSizes, activePatternSet, activeDesign } = get();
    const validated = validateOrderList(items, {
      availableSizes,
      strictNumberUniqueness: strict,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  setAllGarmentTypes: (garmentType) => {
    const { items, availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const updated = items.map((it) => ({ ...it, garmentType }));
    const validated = validateOrderList(updated, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  setAllNecklineTypes: (necklineType) => {
    const { items, availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const updated = items.map((item) => (
      item.garmentType === 'SHORT' ? item : { ...item, necklineType }
    ));
    const validated = validateOrderList(updated, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  applyMassEdit: ({ garmentType, necklineType, sizeName, quantity }) => {
    const { items, availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const updated = items.map((item) => {
      const next = { ...item };
      if (garmentType !== undefined) {
        next.garmentType = garmentType;
      }
      if (necklineType !== undefined && next.garmentType !== 'SHORT') {
        next.necklineType = necklineType;
      }
      if (sizeName !== undefined && sizeName.trim() !== '') {
        next.sizeName = sizeName.trim().toUpperCase();
      }
      if (quantity !== undefined && quantity > 0) {
        next.quantity = quantity;
      }
      return next;
    });
    const validated = validateOrderList(updated, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  loadFromBuffer: (buffer, fileName) => {
    const { availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const result = parseExcelBuffer(buffer, {
      availableSizes,
      strictNumberUniqueness,
    });
    const validated = validateOrderList(result.items, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });

    set({
      items: validated,
      summary: calculateOrderSummary(validated),
      fileName,
    });
  },

  updateItem: (id, updates) => {
    const { items, availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const updatedRaw = items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    const validated = validateOrderList(updatedRaw, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  removeItem: (id) => {
    const { items, availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const filtered = items.filter((it) => it.id !== id);
    const renumbered = filtered.map((it, idx) => ({ ...it, rowNumber: idx + 1 }));
    const validated = validateOrderList(renumbered, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  addItem: (item) => {
    const { items, availableSizes, strictNumberUniqueness, activePatternSet, activeDesign } = get();
    const newItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rowNumber: items.length + 1,
      playerName: item.playerName || '',
      playerNumber: item.playerNumber || '',
      sizeName: item.sizeName || availableSizes[0] || 'S',
      garmentType: item.garmentType || 'COMPLETO',
      necklineType: item.necklineType || 'REDONDO',
      gender: item.gender,
      team: item.team,
      notes: item.notes,
      quantity: item.quantity || 1,
      isValid: true,
      errors: [],
      warnings: [],
    };

    const newItems = [...items, newItem];
    const validated = validateOrderList(newItems, {
      availableSizes,
      strictNumberUniqueness,
      activePatternSet,
      activeDesign,
    });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  clearOrder: () => {
    set({
      items: [],
      summary: calculateOrderSummary([]),
      fileName: null,
      clientName: '',
      teamName: '',
    });
  },
    }),
    {
      name: 'codecima_order_store_v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        items: state.items,
        summary: state.summary,
        clientName: state.clientName,
        teamName: state.teamName,
        sport: state.sport,
        fileName: state.fileName,
        availableSizes: state.availableSizes,
        strictNumberUniqueness: state.strictNumberUniqueness,
      }),
    }
  )
);
