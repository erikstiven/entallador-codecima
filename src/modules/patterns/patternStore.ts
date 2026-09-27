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
}

const DEFAULT_DEMO_SVG = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600.00mm" height="1200.00mm" viewBox="0 0 1600.00 1200.00">
  <g id="TALLA_28">
    <path id="T28_DELANTERO" d="M 50,50 L 150,50 C 180,90 220,90 250,50 L 350,50 C 340,110 320,180 290,220 L 310,650 L 90,650 L 110,220 C 80,180 60,110 50,50 Z" />
    <path id="T28_ESPALDA" d="M 400,50 L 500,50 C 530,65 570,65 600,50 L 700,50 C 690,110 670,180 640,220 L 660,670 L 440,670 L 460,220 C 430,180 410,110 400,50 Z" />
    <path id="T28_MANGA_I" d="M 750,50 C 800,20 860,20 910,50 L 890,240 L 770,240 Z" />
    <path id="T28_MANGA_D" d="M 950,50 C 1000,20 1060,20 1110,50 L 1090,240 L 970,240 Z" />
    <path id="T28_SHORT_F" d="M 750,300 L 980,300 L 990,480 C 950,500 930,550 920,700 L 760,680 L 750,300 Z" />
    <path id="T28_SHORT_A" d="M 1050,300 L 1300,300 L 1310,480 C 1270,510 1250,570 1240,720 L 1060,700 L 1050,300 Z" />
  </g>
  <g id="TALLA_30">
    <path id="T30_DELANTERO" d="M 50,700 L 160,700 C 190,740 230,740 260,700 L 370,700 C 360,760 340,830 310,870 L 330,1330 L 90,1330 L 110,870 C 80,830 60,760 50,700 Z" />
    <path id="T30_ESPALDA" d="M 420,700 L 530,700 C 560,715 600,715 630,700 L 740,700 C 730,760 710,830 680,870 L 700,1350 L 460,1350 L 480,870 C 450,830 430,760 420,700 Z" />
  </g>
  <path id="PIEZA_SUELTA_CUELLO" d="M 800,750 L 1050,750 L 1050,830 L 800,830 Z" />
</svg>`;

export const usePatternStore = create<PatternStoreState>((set, get) => ({
  patternSets: [],
  activePatternSet: null,
  selectedPieceForAssignment: null,

  loadFromDatabase: () => {
    try {
      let sets = getPatternSetsFromDb(dbService);
      if (sets.length === 0) {
        const { patternSet } = parsePatternSvg(
          DEFAULT_DEMO_SVG,
          'MOLDES FUTBOL OFICIAL 2026',
          'FUTBOL',
          'moldes_futbol_2026.svg'
        );
        savePatternSetToDb(dbService, patternSet);
        sets = [patternSet];
      }
      set({ patternSets: sets });
      if (!get().activePatternSet && sets.length > 0) {
        set({ activePatternSet: sets[0] });
      }
    } catch (err) {
      console.error('Error cargando moldes de SQLite:', err);
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
      get().loadFromDatabase();
      if (get().activePatternSet?.id === id) {
        set({ activePatternSet: null });
      }
    } catch (err) {
      console.error('Error eliminando molde de SQLite:', err);
    }
  },
}));
