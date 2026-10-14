import { create } from 'zustand';
import { PatternSet, PatternPiece, PieceType } from './types';
import { parsePatternSvg, getDefaultRotationsForPieceType } from './patternParser';
import { dbService } from '@/core/database/db';
import { useOrderStore } from '@/modules/orders/orderStore';
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

export function sanitizePatternSet(patternSet: PatternSet): PatternSet {
  patternSet.sizes.forEach((s) => {
    // 1. Corregir piezas mal clasificadas como manga que en realidad son pantaloneta
    s.pieces.forEach((p) => {
      if (p.pieceType.startsWith('MANGA') && p.bbox.height >= 320 && p.areaMm2 >= 130000) {
        p.pieceType = 'PANTALONETA_IZQ';
        p.pieceName = `T${s.sizeName}_PANTALONETA`;
        p.allowedRotationsDeg = [0, 180];
      }
    });

    // 2. Nombres amigables para piezas únicas de confección
    const mangas = s.pieces.filter((p) => p.pieceType.startsWith('MANGA'));
    if (mangas.length === 1) {
      mangas[0].pieceName = `T${s.sizeName}_MANGA`;
      mangas[0].pieceType = 'MANGA_IZQ';
    }
    const pantas = s.pieces.filter((p) => p.pieceType.startsWith('PANTALONETA'));
    if (pantas.length === 1) {
      pantas[0].pieceName = `T${s.sizeName}_PANTALONETA`;
      pantas[0].pieceType = 'PANTALONETA_IZQ';
    }
  });
  return patternSet;
}

const ACTIVE_PATTERN_ID_KEY = 'hmb_active_pattern_id_v1';
const LEGACY_PATTERNS_STORAGE_KEY = 'hmb_pattern_sets_v2';

function persistActivePatternId(patternSet: PatternSet | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (patternSet?.id) {
      localStorage.setItem(ACTIVE_PATTERN_ID_KEY, patternSet.id);
    } else {
      localStorage.removeItem(ACTIVE_PATTERN_ID_KEY);
    }
  } catch (_) {}
}

export const usePatternStore = create<PatternStoreState>((set, get) => ({
  patternSets: [],
  activePatternSet: null,
  selectedPieceForAssignment: null,

  loadFromDatabase: () => {
    try {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(LEGACY_PATTERNS_STORAGE_KEY);
        }
      } catch (_) {}

      // Purgar cualquier molde demo remanente en SQLite
      try {
        dbService.run("DELETE FROM pattern_sets WHERE name = 'MOLDES FUTBOL OFICIAL 2026' OR id LIKE '%demo%' OR id = 'set_moldes_futbol_2026'");
      } catch (_) {}

      const existingSetsInMemory = get().patternSets;
      const rawSets = getPatternSetsFromDb(dbService).filter(
        (s) => s.name !== 'MOLDES FUTBOL OFICIAL 2026' && !s.id.includes('demo') && s.id !== 'set_moldes_futbol_2026'
      );
      const sets = rawSets.map((rawSet) => {
        const sanitized = sanitizePatternSet(rawSet);
        const inMemory = existingSetsInMemory.find((m) => m.id === sanitized.id);
        if (
          inMemory &&
          inMemory.unassignedPieces &&
          inMemory.unassignedPieces.length > 0 &&
          sanitized.unassignedPieces.length === 0
        ) {
          return {
            ...sanitized,
            unassignedPieces: inMemory.unassignedPieces,
          };
        }
        return sanitized;
      });

      if (sets.length > 0) {
        let savedActiveId: string | null = get().activePatternSet?.id || null;
        try {
          if (!savedActiveId && typeof localStorage !== 'undefined') {
            savedActiveId = localStorage.getItem(ACTIVE_PATTERN_ID_KEY);
          }
        } catch (_) {}
        const matching = savedActiveId ? sets.find((s) => s.id === savedActiveId) : null;
        const finalActive = matching || sets[0];
        persistActivePatternId(finalActive);
        const currentSelectedPiece = get().selectedPieceForAssignment;
        const nextSelectedPiece =
          currentSelectedPiece && finalActive.unassignedPieces.some((p) => p.id === currentSelectedPiece.id)
            ? currentSelectedPiece
            : finalActive.unassignedPieces.length > 0
              ? finalActive.unassignedPieces[0]
              : null;
        set({
          patternSets: sets,
          activePatternSet: finalActive,
          selectedPieceForAssignment: nextSelectedPiece,
        });
        if (finalActive && finalActive.sizes && finalActive.sizes.length > 0) {
          const patternSizes = finalActive.sizes.map((s) => s.sizeName);
          useOrderStore.getState().setAvailableSizes(patternSizes);
        }
      } else {
        persistActivePatternId(null);
        set({ patternSets: [], activePatternSet: null, selectedPieceForAssignment: null });
      }
    } catch (err) {
      console.warn('SQLite aún no disponible para moldes:', err);
      set({ patternSets: [], activePatternSet: null, selectedPieceForAssignment: null });
    }
  },

  importSvg: (svgContent, setName, garmentType, fileName) => {
    const { patternSet } = parsePatternSvg(svgContent, setName, garmentType, fileName);
    
    const existing = get().patternSets.filter((p) => p.id !== patternSet.id);
    const updatedSets = [patternSet, ...existing];

    persistActivePatternId(patternSet);
    set({
      patternSets: updatedSets,
      activePatternSet: patternSet,
      selectedPieceForAssignment: patternSet.unassignedPieces.length > 0 ? patternSet.unassignedPieces[0] : null,
    });

    if (patternSet.sizes && patternSet.sizes.length > 0) {
      const patternSizes = patternSet.sizes.map((s) => s.sizeName);
      useOrderStore.getState().setAvailableSizes(patternSizes);
    }

    try {
      savePatternSetToDb(dbService, patternSet);
      dbService.scheduleAutoSave();
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

    const updatedSets = get().patternSets.map((s) => s.id === updatedSet.id ? updatedSet : s);

    persistActivePatternId(updatedSet);
    set({
      patternSets: updatedSets,
      activePatternSet: updatedSet,
      selectedPieceForAssignment: newUnassigned.length > 0 ? newUnassigned[0] : null,
    });

    // Persistir cambios en SQLite
    try {
      savePatternSetToDb(dbService, updatedSet);
      dbService.scheduleAutoSave();
    } catch (err) {
      console.error('Error actualizando molde en SQLite:', err);
    }
  },

  saveActiveSet: () => {
    const { activePatternSet, patternSets } = get();
    if (!activePatternSet) return;
    try {
      savePatternSetToDb(dbService, activePatternSet);
      dbService.scheduleAutoSave();
    } catch (err) {
      console.error('Error guardando molde:', err);
    }
    const updatedSets = patternSets.some((s) => s.id === activePatternSet.id)
      ? patternSets.map((s) => (s.id === activePatternSet.id ? activePatternSet : s))
      : [...patternSets, activePatternSet];
    set({ patternSets: updatedSets });
  },

  setActivePatternSet: (patternSet) => {
    persistActivePatternId(patternSet);
    set({
      activePatternSet: patternSet,
      selectedPieceForAssignment: patternSet?.unassignedPieces[0] || null,
    });
    if (patternSet && patternSet.sizes && patternSet.sizes.length > 0) {
      const patternSizes = patternSet.sizes.map((s) => s.sizeName);
      useOrderStore.getState().setAvailableSizes(patternSizes);
    }
  },

  deletePatternSet: (id) => {
    try {
      deletePatternSetFromDb(dbService, id);
      dbService.scheduleAutoSave();
    } catch (err) {
      console.error('Error eliminando molde de SQLite:', err);
    }
    const remaining = get().patternSets.filter((p) => p.id !== id);
    const currentActive = get().activePatternSet;
    const newActive =
      currentActive && currentActive.id !== id
        ? remaining.find((p) => p.id === currentActive.id) || (remaining.length > 0 ? remaining[0] : null)
        : remaining.length > 0
          ? remaining[0]
          : null;
    persistActivePatternId(newActive);
    set({
      patternSets: remaining,
      activePatternSet: newActive,
      selectedPieceForAssignment: newActive && newActive.unassignedPieces.length > 0 ? newActive.unassignedPieces[0] : null,
    });
    if (newActive && newActive.sizes && newActive.sizes.length > 0) {
      const patternSizes = newActive.sizes.map((s) => s.sizeName);
      useOrderStore.getState().setAvailableSizes(patternSizes);
    }
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
    const updatedSets = get().patternSets.map((s) => s.id === updated.id ? updated : s);
    set({
      patternSets: updatedSets,
      activePatternSet: updated,
      selectedPieceForAssignment: remaining.length > 0 ? remaining[0] : null,
    });
    try {
      savePatternSetToDb(dbService, updated);
      dbService.scheduleAutoSave();
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
    const updatedSets = get().patternSets.map((s) => s.id === updated.id ? updated : s);
    set({
      patternSets: updatedSets,
      activePatternSet: updated,
      selectedPieceForAssignment: null,
    });
    try {
      savePatternSetToDb(dbService, updated);
      dbService.scheduleAutoSave();
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
    set({ activePatternSet: updatedSet, patternSets: updatedSets });

    try {
      dbService.run('DELETE FROM pattern_pieces WHERE id = ?', [pieceId]);
      savePatternSetToDb(dbService, updatedSet);
      dbService.scheduleAutoSave();
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
    set({ activePatternSet: updatedSet, patternSets: updatedSets });

    try {
      savePatternSetToDb(dbService, updatedSet);
      dbService.scheduleAutoSave();
    } catch (err) {
      console.error('Error actualizando tipo de pieza en SQLite:', err);
    }
  },

  clearAllPatterns: () => {
    try {
      dbService.run('DELETE FROM pattern_sets');
      dbService.run('DELETE FROM pattern_sizes');
      dbService.run('DELETE FROM pattern_pieces');
      dbService.scheduleAutoSave();
    } catch (err) {
      console.error('Error limpiando moldes de SQLite:', err);
    }
    persistActivePatternId(null);
    set({
      patternSets: [],
      activePatternSet: null,
      selectedPieceForAssignment: null,
    });
  },
}));
