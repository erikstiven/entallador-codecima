import { create } from 'zustand';
import { PatternSet, PatternPiece, PieceType } from './types';
import { parsePatternSvg, getDefaultRotationsForPieceType } from './patternParser';
import { dbService } from '@/core/database/db';
import { 
  savePatternSetToDb, 
  getPatternSetsFromDb, 
  deletePatternSetFromDb 
} from './patternRepository';

interface PatternStoreState {
  patternSets: PatternSet[];
  activePatternSet: PatternSet | null;
  selectedPieceForAssignment: PatternPiece | null;

  loadFromDatabase: () => void;
  importSvg: (svgContent: string, setName: string, garmentType: string, fileName?: string) => PatternSet;
  selectPieceForAssignment: (piece: PatternPiece | null) => void;
  assignPieceManually: (pieceId: string, sizeName: string, pieceType: PieceType, rotations?: number[]) => void;
  saveActiveSet: () => void;
  setActivePatternSet: (set: PatternSet | null) => void;
  deletePatternSet: (id: string) => void;
  discardUnassignedPiece: (pieceId: string) => void;
  discardAllUnassignedPieces: () => void;
  deletePieceFromSize: (sizeName: string, pieceId: string) => void;
  updatePieceType: (sizeName: string, pieceId: string, newType: PieceType) => void;
  clearAllPatterns: () => void;
}

const PATTERNS_STORAGE_KEY = 'hmb_pattern_sets';
const ACTIVE_PATTERN_ID_KEY = 'hmb_active_pattern_set_id';

function loadFromLocalStorage(): { sets: PatternSet[]; activeSet: PatternSet | null } {
  if (typeof window === 'undefined') return { sets: [], activeSet: null };
  try {
    const raw = localStorage.getItem(PATTERNS_STORAGE_KEY);
    if (!raw) return { sets: [], activeSet: null };
    const sets: PatternSet[] = JSON.parse(raw);
    const activeId = localStorage.getItem(ACTIVE_PATTERN_ID_KEY);
    const activeSet = sets.find((s) => s.id === activeId) || (sets.length > 0 ? sets[0] : null);
    return { sets, activeSet };
  } catch (_) {
    return { sets: [], activeSet: null };
  }
}

function saveToLocalStorage(sets: PatternSet[], activeSet: PatternSet | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(sets));
    if (activeSet) {
      localStorage.setItem(ACTIVE_PATTERN_ID_KEY, activeSet.id);
    } else {
      localStorage.removeItem(ACTIVE_PATTERN_ID_KEY);
    }
  } catch (_) {}
}

const initialLocal = loadFromLocalStorage();

export const usePatternStore = create<PatternStoreState>((set, get) => ({
  patternSets: initialLocal.sets,
  activePatternSet: initialLocal.activeSet,
  selectedPieceForAssignment: null,

  loadFromDatabase: () => {
    try {
      // Purgar cualquier molde demo remanente en SQLite
      try {
        dbService.run("DELETE FROM pattern_sets WHERE name = 'MOLDES FUTBOL OFICIAL 2026' OR id LIKE '%demo%' OR id = 'set_moldes_futbol_2026'");
      } catch (_) {}

      const sets = getPatternSetsFromDb(dbService).filter(
        (s) => s.name !== 'MOLDES FUTBOL OFICIAL 2026' && !s.id.includes('demo') && s.id !== 'set_moldes_futbol_2026'
      );

      if (sets.length > 0) {
        set({ patternSets: sets });
        const currentActive = get().activePatternSet;
        const matching = currentActive ? sets.find((s) => s.id === currentActive.id) : null;
        const finalActive = matching || sets[0];
        set({ activePatternSet: finalActive });
        saveToLocalStorage(sets, finalActive);
      } else {
        // Si SQLite está vacío pero localStorage tiene moldes guardados, restaurarlos a SQLite
        const local = loadFromLocalStorage();
        if (local.sets.length > 0) {
          for (const s of local.sets) {
            savePatternSetToDb(dbService, s);
          }
          dbService.persistBrowserDb();
          set({ patternSets: local.sets, activePatternSet: local.activeSet });
        } else {
          set({ patternSets: [], activePatternSet: null, selectedPieceForAssignment: null });
        }
      }
    } catch (err) {
      console.warn('SQLite aún no disponible para moldes:', err);
      const local = loadFromLocalStorage();
      set({ patternSets: local.sets, activePatternSet: local.activeSet, selectedPieceForAssignment: null });
    }
  },

  importSvg: (svgContent, setName, garmentType, fileName) => {
    const { patternSet } = parsePatternSvg(svgContent, setName, garmentType, fileName);
    
    const existing = get().patternSets.filter((p) => p.id !== patternSet.id);
    const updatedSets = [patternSet, ...existing];

    // Guardar en memoria y localStorage de inmediato
    set({
      patternSets: updatedSets,
      activePatternSet: patternSet,
      selectedPieceForAssignment: patternSet.unassignedPieces.length > 0 ? patternSet.unassignedPieces[0] : null,
    });
    saveToLocalStorage(updatedSets, patternSet);

    // Guardar en base de datos local SQLite e IndexedDB
    try {
      savePatternSetToDb(dbService, patternSet);
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error persistiendo molde en SQLite:', err);
    }

    return patternSet;
  },

  selectPieceForAssignment: (piece) => {
    set({ selectedPieceForAssignment: piece });
  },

  assignPieceManually: (pieceId, sizeName, pieceType, rotations) => {
    const { activePatternSet } = get();
    if (!activePatternSet) return;

    // Buscar pieza en unassignedPieces
    const pieceIndex = activePatternSet.unassignedPieces.findIndex((p) => p.id === pieceId);
    let pieceToAssign: PatternPiece;

    const newUnassigned = [...activePatternSet.unassignedPieces];
    if (pieceIndex !== -1) {
      pieceToAssign = { ...newUnassigned[pieceIndex] };
      newUnassigned.splice(pieceIndex, 1);
    } else {
      return;
    }

    const cleanSize = sizeName.trim().toUpperCase();
    const finalRotations = rotations || getDefaultRotationsForPieceType(pieceType);

    pieceToAssign.sizeName = cleanSize;
    pieceToAssign.pieceType = pieceType;
    pieceToAssign.allowedRotationsDeg = finalRotations;
    pieceToAssign.isAssigned = true;

    // Agregar a la talla correspondiente
    const newSizes = [...activePatternSet.sizes];
    const sizeIndex = newSizes.findIndex((s) => s.sizeName.toUpperCase() === cleanSize);

    if (sizeIndex !== -1) {
      newSizes[sizeIndex].pieces.push(pieceToAssign);
    } else {
      newSizes.push({
        id: `size_${cleanSize}_${Date.now()}`,
        sizeName: cleanSize,
        sortOrder: newSizes.length + 1,
        pieces: [pieceToAssign],
      });
    }

    const updatedSet: PatternSet = {
      ...activePatternSet,
      sizes: newSizes,
      unassignedPieces: newUnassigned,
      updatedAt: new Date().toISOString(),
    };

    set({
      activePatternSet: updatedSet,
      selectedPieceForAssignment: newUnassigned.length > 0 ? newUnassigned[0] : null,
    });

    // Persistir cambios en SQLite
    try {
      savePatternSetToDb(dbService, updatedSet);
      get().loadFromDatabase();
    } catch (err) {
      console.error('Error actualizando molde en SQLite:', err);
    }
  },

  saveActiveSet: () => {
    const { activePatternSet, patternSets } = get();
    if (!activePatternSet) return;
    try {
      savePatternSetToDb(dbService, activePatternSet);
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error guardando molde:', err);
    }
    const updatedSets = patternSets.some((s) => s.id === activePatternSet.id)
      ? patternSets.map((s) => (s.id === activePatternSet.id ? activePatternSet : s))
      : [...patternSets, activePatternSet];
    saveToLocalStorage(updatedSets, activePatternSet);
    set({ patternSets: updatedSets });
  },

  setActivePatternSet: (patternSet) => {
    set({
      activePatternSet: patternSet,
      selectedPieceForAssignment: patternSet?.unassignedPieces[0] || null,
    });
    saveToLocalStorage(get().patternSets, patternSet);
  },

  deletePatternSet: (id) => {
    try {
      deletePatternSetFromDb(dbService, id);
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error eliminando molde de SQLite:', err);
    }
    const remaining = get().patternSets.filter((p) => p.id !== id);
    const newActive = remaining.length > 0 ? remaining[0] : null;
    saveToLocalStorage(remaining, newActive);
    set({
      patternSets: remaining,
      activePatternSet: newActive,
      selectedPieceForAssignment: newActive && newActive.unassignedPieces.length > 0 ? newActive.unassignedPieces[0] : null,
    });
  },

  discardUnassignedPiece: (pieceId) => {
    const { activePatternSet } = get();
    if (!activePatternSet) return;
    const remaining = activePatternSet.unassignedPieces.filter((p) => p.id !== pieceId);
    const updated = {
      ...activePatternSet,
      unassignedPieces: remaining,
      updatedAt: new Date().toISOString(),
    };
    set({
      activePatternSet: updated,
      selectedPieceForAssignment: remaining.length > 0 ? remaining[0] : null,
    });
    const updatedSets = get().patternSets.map((s) => s.id === updated.id ? updated : s);
    saveToLocalStorage(updatedSets, updated);
    try {
      savePatternSetToDb(dbService, updated);
      dbService.persistBrowserDb();
    } catch (_) {}
  },

  discardAllUnassignedPieces: () => {
    const { activePatternSet } = get();
    if (!activePatternSet) return;
    const updated = {
      ...activePatternSet,
      unassignedPieces: [],
      updatedAt: new Date().toISOString(),
    };
    set({
      activePatternSet: updated,
      selectedPieceForAssignment: null,
    });
    const updatedSets = get().patternSets.map((s) => s.id === updated.id ? updated : s);
    saveToLocalStorage(updatedSets, updated);
    try {
      savePatternSetToDb(dbService, updated);
      dbService.persistBrowserDb();
    } catch (_) {}
  },

  deletePieceFromSize: (sizeName: string, pieceId: string) => {
    const { activePatternSet } = get();
    if (!activePatternSet) return;

    const newSizes = activePatternSet.sizes.map((s) => {
      if (s.sizeName.toUpperCase() !== sizeName.toUpperCase()) return s;
      return {
        ...s,
        pieces: s.pieces.filter((p) => p.id !== pieceId),
      };
    });

    const updatedSet: PatternSet = {
      ...activePatternSet,
      sizes: newSizes,
      updatedAt: new Date().toISOString(),
    };

    const updatedSets = get().patternSets.map((s) => s.id === updatedSet.id ? updatedSet : s);
    saveToLocalStorage(updatedSets, updatedSet);
    set({ activePatternSet: updatedSet, patternSets: updatedSets });

    try {
      dbService.run('DELETE FROM pattern_pieces WHERE id = ?', [pieceId]);
      savePatternSetToDb(dbService, updatedSet);
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error eliminando pieza de SQLite:', err);
    }
  },

  updatePieceType: (sizeName: string, pieceId: string, newType: PieceType) => {
    const { activePatternSet } = get();
    if (!activePatternSet) return;

    const newSizes = activePatternSet.sizes.map((s) => {
      if (s.sizeName.toUpperCase() !== sizeName.toUpperCase()) return s;
      return {
        ...s,
        pieces: s.pieces.map((p) => {
          if (p.id !== pieceId) return p;
          return {
            ...p,
            pieceType: newType,
            pieceName: `T${s.sizeName}_${newType}`,
            allowedRotationsDeg: getDefaultRotationsForPieceType(newType),
          };
        }),
      };
    });

    const updatedSet: PatternSet = {
      ...activePatternSet,
      sizes: newSizes,
      updatedAt: new Date().toISOString(),
    };

    const updatedSets = get().patternSets.map((s) => s.id === updatedSet.id ? updatedSet : s);
    saveToLocalStorage(updatedSets, updatedSet);
    set({ activePatternSet: updatedSet, patternSets: updatedSets });

    try {
      savePatternSetToDb(dbService, updatedSet);
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error actualizando tipo de pieza en SQLite:', err);
    }
  },

  clearAllPatterns: () => {
    try {
      dbService.run('DELETE FROM pattern_sets');
      dbService.run('DELETE FROM pattern_sizes');
      dbService.run('DELETE FROM pattern_pieces');
      dbService.persistBrowserDb();
    } catch (err) {
      console.error('Error limpiando moldes de SQLite:', err);
    }
    saveToLocalStorage([], null);
    set({
      patternSets: [],
      activePatternSet: null,
      selectedPieceForAssignment: null,
    });
  },
}));
