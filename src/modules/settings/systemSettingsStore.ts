import { create } from 'zustand';

export type DisplayUnit = 'mm' | 'cm' | 'in';
export type ExportFormatPref = 'SVG' | 'PDF' | 'EPS';
export type GroupingModePref = 'PLAYER' | 'SIZE' | 'PIECE_TYPE' | 'NONE';
export type BrandColor = 'violet' | 'indigo' | 'blue' | 'emerald' | 'amber';

export interface BrandColorConfig {
  id: BrandColor;
  label: string;
  primary: string;
  hover: string;
  light: string;
  text: string;
}

export const BRAND_COLORS: Record<BrandColor, BrandColorConfig> = {
  violet: {
    id: 'violet',
    label: 'Violeta',
    primary: '#7c3aed',
    hover: '#6d28d9',
    light: '#f5f3ff',
    text: '#ffffff',
  },
  indigo: {
    id: 'indigo',
    label: 'Índigo',
    primary: '#4f46e5',
    hover: '#4338ca',
    light: '#eef2ff',
    text: '#ffffff',
  },
  blue: {
    id: 'blue',
    label: 'Azul',
    primary: '#2563eb',
    hover: '#1d4ed8',
    light: '#eff6ff',
    text: '#ffffff',
  },
  emerald: {
    id: 'emerald',
    label: 'Esmeralda',
    primary: '#059669',
    hover: '#047857',
    light: '#ecfdf5',
    text: '#ffffff',
  },
  amber: {
    id: 'amber',
    label: 'Ámbar',
    primary: '#d97706',
    hover: '#b45309',
    light: '#fffbeb',
    text: '#ffffff',
  },
};

export function applyBrandColorToDom(color: BrandColor): void {
  if (typeof document === 'undefined') return;
  const config = BRAND_COLORS[color] || BRAND_COLORS.violet;
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', config.primary);
  root.style.setProperty('--brand-primary-hover', config.hover);
  root.style.setProperty('--brand-primary-light', config.light);
  root.style.setProperty('--brand-primary-text', config.text);
}

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

  // 5. Marca y Personalización
  brandColor: BrandColor;
}

interface SystemSettingsState {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  setBrandColor: (color: BrandColor) => void;
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
  brandColor: 'violet',
};

function loadStoredSettings(): SystemSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    }
  } catch (err) {
    console.warn('Error al leer settings de localStorage:', err);
  }
  return DEFAULT_SETTINGS;
}

const initialSettings = loadStoredSettings();
if (typeof document !== 'undefined') {
  applyBrandColorToDom(initialSettings.brandColor);
}

export const useSystemSettingsStore = create<SystemSettingsState>((set, get) => ({
  settings: initialSettings,
  updateSettings: (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    if (updates.brandColor) {
      applyBrandColorToDom(updates.brandColor);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('Error al guardar settings en localStorage:', err);
    }
  },
  setBrandColor: (color) => {
    const newSettings = { ...get().settings, brandColor: color };
    set({ settings: newSettings });
    applyBrandColorToDom(color);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('Error al guardar brandColor en localStorage:', err);
    }
  },
  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS });
    applyBrandColorToDom(DEFAULT_SETTINGS.brandColor);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.warn('Error al resetear settings:', err);
    }
  },
}));
