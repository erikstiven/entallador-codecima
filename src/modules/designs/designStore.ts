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

const DESIGNS_STORAGE_KEY = 'hmb_master_designs';
const ACTIVE_DESIGN_ID_KEY = 'hmb_active_design_id';

function loadDesignsFromLocalStorage(): { designs: MasterDesign[]; activeDesign: MasterDesign | null } {
  if (typeof window === 'undefined') return { designs: [], activeDesign: null };
  try {
    const raw = localStorage.getItem(DESIGNS_STORAGE_KEY);
    if (!raw) return { designs: [], activeDesign: null };
    const designs: MasterDesign[] = JSON.parse(raw);
    const activeId = localStorage.getItem(ACTIVE_DESIGN_ID_KEY);
    const activeDesign = designs.find((d) => d.id === activeId) || (designs.length > 0 ? designs[0] : null);
    return { designs, activeDesign };
  } catch (_) {
    return { designs: [], activeDesign: null };
  }
}

function saveDesignsToLocalStorage(designs: MasterDesign[], activeDesign: MasterDesign | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DESIGNS_STORAGE_KEY, JSON.stringify(designs));
    if (activeDesign) {
      localStorage.setItem(ACTIVE_DESIGN_ID_KEY, activeDesign.id);
    } else {
      localStorage.removeItem(ACTIVE_DESIGN_ID_KEY);
    }
  } catch (_) {}
}

const initialDesigns = loadDesignsFromLocalStorage();

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  designs: initialDesigns.designs,
  activeDesign: initialDesigns.activeDesign,

  loadDesignsFromDatabase: () => {
    try {
      try {
        dbService.run("DELETE FROM designs WHERE id IN ('des_holanda', 'des_brasil', 'des_argentina')");
      } catch (_) {}

      const list = getDesignsFromDb(dbService).filter(
        (d) => !['des_holanda', 'des_brasil', 'des_argentina'].includes(d.id)
      );

      if (list.length > 0) {
        set({ designs: list });
        const currentActive = get().activeDesign;
        const matching = currentActive ? list.find((d) => d.id === currentActive.id) : null;
        const finalActive = matching || list[0];
        set({ activeDesign: finalActive });
        saveDesignsToLocalStorage(list, finalActive);
      } else {
        const local = loadDesignsFromLocalStorage();
        if (local.designs.length > 0) {
          for (const d of local.designs) {
            saveDesignToDb(dbService, d);
          }
          dbService.persistBrowserDb();
          set({ designs: local.designs, activeDesign: local.activeDesign });
        } else {
          set({ designs: [], activeDesign: null });
        }
      }
    } catch (err) {
      console.warn('SQLite aún no disponible para diseños:', err);
      const local = loadDesignsFromLocalStorage();
      set({ designs: local.designs, activeDesign: local.activeDesign });
    }
  },

  importDesignSvg: (svgContent, name, sport = 'FUTBOL', fileName) => {
    const newDesign = parseDesignSvg(svgContent, name, sport, fileName);
    try {
      saveDesignToDb(dbService, newDesign);
      dbService.persistBrowserDb();
    } catch (_) {}
    const updated = [newDesign, ...get().designs.filter((d) => d.id !== newDesign.id)];
    saveDesignsToLocalStorage(updated, newDesign);
    set({ designs: updated, activeDesign: newDesign });
    return newDesign;
  },

  clearAllDesigns: () => {
    try {
      dbService.run('DELETE FROM designs');
      dbService.persistBrowserDb();
    } catch (_) {}
    saveDesignsToLocalStorage([], null);
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

    try {
      saveDesignToDb(dbService, newDesign);
      dbService.persistBrowserDb();
    } catch (_) {}

    const updated = [newDesign, ...get().designs.filter((d) => d.id !== newDesign.id)];
    saveDesignsToLocalStorage(updated, newDesign);
    set({ designs: updated, activeDesign: newDesign });
    return newDesign;
  },

  setActiveDesign: (design) => {
    set({ activeDesign: design });
    saveDesignsToLocalStorage(get().designs, design);
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

    try {
      saveDesignToDb(dbService, updatedDesign);
      dbService.persistBrowserDb();
    } catch (_) {}

    const updatedDesigns = designs.map((d) => (d.id === updatedDesign.id ? updatedDesign : d));
    saveDesignsToLocalStorage(updatedDesigns, updatedDesign);
    set({ designs: updatedDesigns, activeDesign: updatedDesign });
  },

  deleteDesign: (id) => {
    try {
      deleteDesignFromDb(dbService, id);
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error eliminando diseño de SQLite:', err);
    }
    const remaining = get().designs.filter((d) => d.id !== id);
    const newActive = remaining.length > 0 ? remaining[0] : null;
    saveDesignsToLocalStorage(remaining, newActive);
    set({ designs: remaining, activeDesign: newActive });
  },
}));
