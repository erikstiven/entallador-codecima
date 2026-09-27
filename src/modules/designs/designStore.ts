import { create } from 'zustand';
import { MasterDesign, DynamicPlaceholderRule } from './types';
import { PieceType } from '@/core/geometry/types';
import { dbService } from '@/core/database/db';
import { 
  getDesignsFromDb, 
  saveDesignToDb, 
  deleteDesignFromDb, 
  seedDefaultMasterDesigns,
  createDefaultPlaceholderRules
} from './designRepository';

interface DesignStoreState {
  designs: MasterDesign[];
  activeDesign: MasterDesign | null;

  loadDesignsFromDatabase: () => void;
  createDesign: (name: string, sport: string, colors: string[]) => MasterDesign;
  setActiveDesign: (design: MasterDesign | null) => void;
  updatePlaceholderRule: (
    designId: string,
    pieceType: PieceType,
    ruleId: string,
    updates: Partial<DynamicPlaceholderRule>
  ) => void;
  deleteDesign: (id: string) => void;
}

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  designs: [],
  activeDesign: null,

  loadDesignsFromDatabase: () => {
    try {
      seedDefaultMasterDesigns(dbService);
      const list = getDesignsFromDb(dbService);
      set({ designs: list });
      if (!get().activeDesign && list.length > 0) {
        set({ activeDesign: list[0] });
      }
    } catch (err) {
      console.error('Error cargando diseños de SQLite:', err);
    }
  },

  createDesign: (name, sport, colors) => {
    const newDesign: MasterDesign = {
      id: `design_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      sport,
      colors,
      pieceArtworks: {
        DELANTERO: {
          pieceType: 'DELANTERO',
          svgArtContent: `<rect width="500" height="700" fill="${colors[0] || '#ea580c'}" />`,
          placeholders: createDefaultPlaceholderRules('DELANTERO'),
        },
        ESPALDA: {
          pieceType: 'ESPALDA',
          svgArtContent: `<rect width="500" height="700" fill="${colors[0] || '#ea580c'}" />`,
          placeholders: createDefaultPlaceholderRules('ESPALDA'),
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDesignToDb(dbService, newDesign);
    get().loadDesignsFromDatabase();
    set({ activeDesign: newDesign });
    return newDesign;
  },

  setActiveDesign: (design) => {
    set({ activeDesign: design });
  },

  updatePlaceholderRule: (designId, pieceType, ruleId, updates) => {
    const { designs, activeDesign } = get();
    const targetDesign = designs.find((d) => d.id === designId) || activeDesign;
    if (!targetDesign) return;

    const artwork = targetDesign.pieceArtworks[pieceType];
    if (!artwork) return;

    const newPlaceholders = artwork.placeholders.map((p) =>
      p.id === ruleId ? { ...p, ...updates } : p
    );

    const updatedDesign: MasterDesign = {
      ...targetDesign,
      pieceArtworks: {
        ...targetDesign.pieceArtworks,
        [pieceType]: {
          ...artwork,
          placeholders: newPlaceholders,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    saveDesignToDb(dbService, updatedDesign);
    get().loadDesignsFromDatabase();
    set({ activeDesign: updatedDesign });
  },

  deleteDesign: (id) => {
    try {
      deleteDesignFromDb(dbService, id);
      get().loadDesignsFromDatabase();
      if (get().activeDesign?.id === id) {
        set({ activeDesign: null });
      }
    } catch (err) {
      console.error('Error eliminando diseño de SQLite:', err);
    }
  },
}));
