import { create } from 'zustand';
import { 
  OrderItem, 
  OrderSummary, 
  OrderValidationConfig,
  GarmentType 
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

  // Actions
  setClientName: (name: string) => void;
  setTeamName: (team: string) => void;
  setSport: (sport: string) => void;
  setAvailableSizes: (sizes: string[]) => void;
  setStrictNumberUniqueness: (strict: boolean) => void;
  setAllGarmentTypes: (garmentType: GarmentType) => void;
  
  loadFromBuffer: (buffer: ArrayBuffer | Uint8Array, fileName: string) => void;
  updateItem: (id: string, updates: Partial<OrderItem>) => void;
  removeItem: (id: string) => void;
  addItem: (item: Partial<OrderItem>) => void;
  clearOrder: () => void;
}

const DEFAULT_AVAILABLE_SIZES = ['26', '28', '30', '32', '34', 'S', 'M', 'L', 'XL', 'XXL'];

export const useOrderStore = create<OrderState>((set, get) => ({
  items: [],
  summary: calculateOrderSummary([]),
  clientName: '',
  teamName: '',
  sport: 'FUTBOL',
  fileName: null,
  availableSizes: DEFAULT_AVAILABLE_SIZES,
  strictNumberUniqueness: false,

  setClientName: (clientName) => set({ clientName }),
  setTeamName: (teamName) => set({ teamName }),
  setSport: (sport) => set({ sport }),
  
  setAvailableSizes: (sizes) => {
    set({ availableSizes: sizes });
    const { items, strictNumberUniqueness } = get();
    const validated = validateOrderList(items, { availableSizes: sizes, strictNumberUniqueness });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  setStrictNumberUniqueness: (strict) => {
    set({ strictNumberUniqueness: strict });
    const { items, availableSizes } = get();
    const validated = validateOrderList(items, { availableSizes, strictNumberUniqueness: strict });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  setAllGarmentTypes: (garmentType) => {
    const { items, availableSizes, strictNumberUniqueness } = get();
    const updated = items.map((it) => ({ ...it, garmentType }));
    const validated = validateOrderList(updated, { availableSizes, strictNumberUniqueness });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  loadFromBuffer: (buffer, fileName) => {
    const { availableSizes, strictNumberUniqueness } = get();
    const result = parseExcelBuffer(buffer, {
      availableSizes,
      strictNumberUniqueness,
    });

    set({
      items: result.items,
      summary: result.summary,
      fileName,
    });
  },

  updateItem: (id, updates) => {
    const { items, availableSizes, strictNumberUniqueness } = get();
    const updatedRaw = items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    const validated = validateOrderList(updatedRaw, { availableSizes, strictNumberUniqueness });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  removeItem: (id) => {
    const { items, availableSizes, strictNumberUniqueness } = get();
    const filtered = items.filter((it) => it.id !== id);
    const renumbered = filtered.map((it, idx) => ({ ...it, rowNumber: idx + 1 }));
    const validated = validateOrderList(renumbered, { availableSizes, strictNumberUniqueness });
    set({ items: validated, summary: calculateOrderSummary(validated) });
  },

  addItem: (item) => {
    const { items, availableSizes, strictNumberUniqueness } = get();
    const newItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rowNumber: items.length + 1,
      playerName: item.playerName || '',
      playerNumber: item.playerNumber || '',
      sizeName: item.sizeName || '28',
      garmentType: item.garmentType || 'COMPLETO',
      gender: item.gender,
      team: item.team,
      notes: item.notes,
      quantity: item.quantity || 1,
      isValid: true,
      errors: [],
      warnings: [],
    };

    const newItems = [...items, newItem];
    const validated = validateOrderList(newItems, { availableSizes, strictNumberUniqueness });
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
}));
