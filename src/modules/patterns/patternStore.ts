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
<svg xmlns="http://www.w3.org/2000/svg" width="2000.00mm" height="2000.00mm" viewBox="0 0 2000.00 2000.00">
  <g id="TALLA_28">
    <path id="T28_DELANTERO" d="M 50,50 L 150,50 C 180,90 220,90 250,50 L 350,50 C 340,110 320,180 290,220 L 310,650 L 90,650 L 110,220 C 80,180 60,110 50,50 Z" />
    <path id="T28_ESPALDA" d="M 400,50 L 500,50 C 530,65 570,65 600,50 L 700,50 C 690,110 670,180 640,220 L 660,670 L 440,670 L 460,220 C 430,180 410,110 400,50 Z" />
    <path id="T28_MANGA_I" d="M 750,50 C 800,20 860,20 910,50 L 890,240 L 770,240 Z" />
    <path id="T28_MANGA_D" d="M 950,50 C 1000,20 1060,20 1110,50 L 1090,240 L 970,240 Z" />
    <path id="T28_SHORT_F" d="M 750,300 L 980,300 L 990,480 C 950,500 930,550 920,700 L 760,680 L 750,300 Z" />
    <path id="T28_SHORT_A" d="M 1050,300 L 1300,300 L 1310,480 C 1270,510 1250,570 1240,720 L 1060,700 L 1050,300 Z" />
  </g>
  <g id="TALLA_30">
    <path id="T30_DELANTERO" d="M 50,50 L 155,50 C 185,90 225,90 255,50 L 360,50 C 350,110 330,180 300,220 L 320,670 L 90,670 L 110,220 C 80,180 60,110 50,50 Z" />
    <path id="T30_ESPALDA" d="M 400,50 L 505,50 C 535,65 575,65 605,50 L 710,50 C 700,110 680,180 650,220 L 670,690 L 440,690 L 460,220 C 430,180 410,110 400,50 Z" />
    <path id="T30_MANGA_I" d="M 750,50 C 805,20 865,20 920,50 L 900,250 L 770,250 Z" />
    <path id="T30_MANGA_D" d="M 950,50 C 1005,20 1065,20 1120,50 L 1100,250 L 970,250 Z" />
    <path id="T30_SHORT_F" d="M 750,300 L 990,300 L 1000,490 C 960,510 940,560 930,720 L 760,700 L 750,300 Z" />
    <path id="T30_SHORT_A" d="M 1050,300 L 1310,300 L 1320,490 C 1280,520 1260,580 1250,740 L 1060,720 L 1050,300 Z" />
  </g>
  <g id="TALLA_32">
    <path id="T32_DELANTERO" d="M 50,50 L 160,50 C 190,90 230,90 260,50 L 370,50 C 360,110 340,180 310,220 L 330,690 L 90,690 L 110,220 C 80,180 60,110 50,50 Z" />
    <path id="T32_ESPALDA" d="M 400,50 L 510,50 C 540,65 580,65 610,50 L 720,50 C 710,110 690,180 660,220 L 680,710 L 440,710 L 460,220 C 430,180 410,110 400,50 Z" />
    <path id="T32_MANGA_I" d="M 750,50 C 810,20 870,20 930,50 L 910,260 L 770,260 Z" />
    <path id="T32_MANGA_D" d="M 950,50 C 1010,20 1070,20 1130,50 L 1110,260 L 970,260 Z" />
    <path id="T32_SHORT_F" d="M 750,300 L 1000,300 L 1010,500 C 970,520 950,570 940,740 L 760,720 L 750,300 Z" />
    <path id="T32_SHORT_A" d="M 1050,300 L 1320,300 L 1330,500 C 1290,530 1270,590 1260,760 L 1060,740 L 1050,300 Z" />
  </g>
  <g id="TALLA_S">
    <path id="TS_DELANTERO" d="M 50,50 L 165,50 C 195,90 235,90 265,50 L 380,50 C 370,110 350,180 320,220 L 340,710 L 90,710 L 110,220 C 80,180 60,110 50,50 Z" />
    <path id="TS_ESPALDA" d="M 400,50 L 515,50 C 545,65 585,65 615,50 L 730,50 C 720,110 700,180 670,220 L 690,730 L 440,730 L 460,220 C 430,180 410,110 400,50 Z" />
    <path id="TS_MANGA_I" d="M 750,50 C 815,20 875,20 940,50 L 920,270 L 770,270 Z" />
    <path id="TS_MANGA_D" d="M 950,50 C 1015,20 1075,20 1140,50 L 1120,270 L 970,270 Z" />
    <path id="TS_SHORT_F" d="M 750,300 L 1010,300 L 1020,510 C 980,530 960,580 950,760 L 760,740 L 750,300 Z" />
    <path id="TS_SHORT_A" d="M 1050,300 L 1330,300 L 1340,510 C 1300,540 1280,600 1270,780 L 1060,760 L 1050,300 Z" />
  </g>
  <g id="TALLA_M">
    <path id="TM_DELANTERO" d="M 50,50 L 170,50 C 200,90 240,90 270,50 L 390,50 C 380,110 360,180 330,220 L 350,730 L 90,730 L 110,220 C 80,180 60,110 50,50 Z" />
    <path id="TM_ESPALDA" d="M 400,50 L 520,50 C 550,65 590,65 620,50 L 740,50 C 730,110 710,180 680,220 L 700,750 L 440,750 L 460,220 C 430,180 410,110 400,50 Z" />
    <path id="TM_MANGA_I" d="M 750,50 C 820,20 880,20 950,50 L 930,280 L 770,280 Z" />
    <path id="TM_MANGA_D" d="M 950,50 C 1020,20 1080,20 1150,50 L 1130,280 L 970,280 Z" />
    <path id="TM_SHORT_F" d="M 750,300 L 1020,300 L 1030,520 C 990,540 970,590 960,780 L 760,760 L 750,300 Z" />
    <path id="TM_SHORT_A" d="M 1050,300 L 1340,300 L 1350,520 C 1310,550 1290,610 1280,800 L 1060,780 L 1050,300 Z" />
  </g>
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
