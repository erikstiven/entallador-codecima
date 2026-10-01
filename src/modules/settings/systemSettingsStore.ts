import { create } from 'zustand';

export type DisplayUnit = 'mm' | 'cm' | 'in';
export type ExportFormatPref = 'SVG' | 'PDF' | 'EPS';
export type GroupingModePref = 'PLAYER' | 'SIZE' | 'PIECE_TYPE' | 'NONE';

export interface SystemSettings {
  // 1. Datos de Empresa y Taller
  companyName: string;
  workshopName: string;
  operatorName: string;

  // 2. Unidades y Formato Visual
  displayUnit: DisplayUnit;
  decimalPrecision: number;

  // 3. Preferencias de Confección y Producción
  defaultPieceSpacingMm: number;
  defaultHemMarginMm: number;
  autoIncludeLabels: boolean;
  labelFontSizeMm: number;

  // 4. Exportación
  defaultExportFormat: ExportFormatPref;
  defaultGroupingMode: GroupingModePref;
}

interface SystemSettingsState {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'codecima_system_settings';

const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'Codecima',
  workshopName: 'Codecima Taller de Sublimación Deportiva',
  operatorName: 'Diseñador Codecima',
  displayUnit: 'mm',
  decimalPrecision: 1,
  defaultPieceSpacingMm: 7.0,
  defaultHemMarginMm: 20.0,
  autoIncludeLabels: true,
  labelFontSizeMm: 5.0,
  defaultExportFormat: 'SVG',
  defaultGroupingMode: 'PLAYER',
};

function loadStoredSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Error al leer settings de localStorage:', err);
  }
  return DEFAULT_SETTINGS;
}

export const useSystemSettingsStore = create<SystemSettingsState>((set, get) => ({
  settings: loadStoredSettings(),
  updateSettings: (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('Error al guardar settings en localStorage:', err);
    }
  },
  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.warn('Error al resetear settings:', err);
    }
  },
}));
