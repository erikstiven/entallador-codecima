import { create } from 'zustand';
import { MasterDesign, DynamicPlaceholderRule } from './types';
import { PieceType } from '@/core/geometry/types';
import { dbService } from '@/core/database/db';
import { 
  getDesignsFromDb, 
  saveDesignToDb, 
  deleteDesignFromDb, 
  createDefaultPlaceholderRules
} from './designRepository';
import { parseDesignSvg } from './designParser';

interface DesignStoreState {
  designs: MasterDesign[];
  activeDesign: MasterDesign | null;

  loadDesignsFromDatabase: () => void;
  importDesignSvg: (svgContent: string, name: string, sport?: string, fileName?: string) => MasterDesign;
  createDesign: (name: string, sport: string, colors: string[]) => MasterDesign;
  setActiveDesign: (design: MasterDesign | null) => void;
  updatePlaceholderRule: (
    designId: string,
    pieceType: PieceType,
    ruleId: string,
    updates: Partial<DynamicPlaceholderRule>
  ) => void;
  deleteDesign: (id: string) => void;
  clearAllDesigns: () => void;
}

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  designs: [],
  activeDesign: null,

  loadDesignsFromDatabase: () => {
    try {
      const list = getDesignsFromDb(dbService);
      set({ designs: list });
      if (!get().activeDesign && list.length > 0) {
        set({ activeDesign: list[0] });
      }
    } catch (err) {
      console.warn('SQLite aún no disponible para diseños:', err);
    }
  },

  importDesignSvg: (svgContent, name, sport = 'FUTBOL', fileName) => {
    const newDesign = parseDesignSvg(svgContent, name, sport, fileName);
    try {
      saveDesignToDb(dbService, newDesign);
    } catch (_) {}
    const updated = [newDesign, ...get().designs.filter((d) => d.id !== newDesign.id)];
    set({ designs: updated, activeDesign: newDesign });
    return newDesign;
  },

  clearAllDesigns: () => {
    try {
      dbService.run('DELETE FROM designs');
    } catch (_) {}
    set({ designs: [], activeDesign: null });
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
