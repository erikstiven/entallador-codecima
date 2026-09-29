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
  clearAllPatterns: () => void;
}

export const usePatternStore = create<PatternStoreState>((set, get) => ({
  patternSets: [],
  activePatternSet: null,
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
      set({ patternSets: sets });
      if (!get().activePatternSet && sets.length > 0) {
        set({ activePatternSet: sets[0] });
      } else if (sets.length === 0) {
        set({ activePatternSet: null, selectedPieceForAssignment: null });
      }
    } catch (err) {
      console.warn('SQLite aún no disponible para moldes:', err);
      set({ patternSets: [], activePatternSet: null, selectedPieceForAssignment: null });
    }
  },

  importSvg: (svgContent, setName, garmentType, fileName) => {
    const { patternSet } = parsePatternSvg(svgContent, setName, garmentType, fileName);
    
    // Guardar en estado activo
    set({
      activePatternSet: patternSet,
      selectedPieceForAssignment: patternSet.unassignedPieces.length > 0 ? patternSet.unassignedPieces[0] : null,
    });

    // Guardar en base de datos local
    try {
      savePatternSetToDb(dbService, patternSet);
      get().loadFromDatabase();
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
    const { activePatternSet } = get();
    if (!activePatternSet) return;
    try {
      savePatternSetToDb(dbService, activePatternSet);
      get().loadFromDatabase();
    } catch (err) {
      console.error('Error guardando molde:', err);
    }
  },

  setActivePatternSet: (patternSet) => {
    set({
      activePatternSet: patternSet,
      selectedPieceForAssignment: patternSet?.unassignedPieces[0] || null,
    });
  },

  deletePatternSet: (id) => {
    try {
      deletePatternSetFromDb(dbService, id);
    } catch (err) {
      console.error('Error eliminando molde de SQLite:', err);
    }
    const remaining = get().patternSets.filter((p) => p.id !== id);
    set({
      patternSets: remaining,
      activePatternSet: remaining.length > 0 ? remaining[0] : null,
      selectedPieceForAssignment: remaining.length > 0 && remaining[0].unassignedPieces.length > 0 ? remaining[0].unassignedPieces[0] : null,
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
    try {
      savePatternSetToDb(dbService, updated);
    } catch (_) {}
  },

  clearAllPatterns: () => {
    try {
      dbService.run('DELETE FROM pattern_sets');
      dbService.run('DELETE FROM pattern_sizes');
      dbService.run('DELETE FROM pattern_pieces');
    } catch (err) {
      console.error('Error limpiando moldes de SQLite:', err);
    }
    set({
      patternSets: [],
      activePatternSet: null,
      selectedPieceForAssignment: null,
    });
  },
}));
