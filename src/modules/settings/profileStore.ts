import { create } from 'zustand';
import { ProductionProfile } from '@/core/geometry/types';

export type { ProductionProfile };

interface ProfileState {
  profiles: ProductionProfile[];
  activeProfile: ProductionProfile;
  setActiveProfile: (profile: ProductionProfile) => void;
  updateActiveProfile: (updates: Partial<ProductionProfile>) => void;
  addProfile: (profile: ProductionProfile) => void;
  deleteProfile: (id: string) => void;
}

const DEFAULT_PROFILES: ProductionProfile[] = [
  {
    id: 'profile_lienzo_112_200',
    name: 'Lienzo 112 x 200 cm',
    totalRollWidthMm: 1120.0,
    maxHeightMm: 2000.0,
    leftMarginMm: 0,
    rightMarginMm: 0,
    printableWidthMm: 1120.0,
    pieceSpacingMm: 7.0,
    topMarginMm: 0,
    bottomMarginMm: 0,
  },
];

const PROFILE_STORAGE_KEY = 'codecima_production_profile';
const PROFILES_LIST_STORAGE_KEY = 'codecima_production_profiles_list';

function loadStoredProfiles(): ProductionProfile[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return DEFAULT_PROFILES;
  }
  try {
    const raw = localStorage.getItem(PROFILES_LIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error al leer profiles de localStorage:', err);
  }
  return DEFAULT_PROFILES;
}

function loadStoredProfile(availableProfiles: ProductionProfile[]): ProductionProfile {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return availableProfiles[0] || DEFAULT_PROFILES[0];
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalRollWidthMm === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error al leer activeProfile de localStorage:', err);
  }
  return availableProfiles[0] || DEFAULT_PROFILES[0];
}

const initialProfiles = loadStoredProfiles();

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: initialProfiles,
  activeProfile: loadStoredProfile(initialProfiles),
  setActiveProfile: (profile) => {
    set({ activeProfile: profile });
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.warn('Error al guardar activeProfile en localStorage:', err);
    }
  },
  updateActiveProfile: (updates) =>
    set((state) => {
      const updated = { ...state.activeProfile, ...updates };
      // Recalcular área útil si cambian anchos o márgenes
      if (
        updates.totalRollWidthMm !== undefined ||
        updates.leftMarginMm !== undefined ||
        updates.rightMarginMm !== undefined
      ) {
        const left = updated.leftMarginMm ?? 0;
        const right = updated.rightMarginMm ?? 0;
        updated.printableWidthMm = Math.max(0, updated.totalRollWidthMm - (left + right));
      }
      
      // Actualizar también en la lista de perfiles si coincide el id
      const updatedProfiles = state.profiles.map((p) => (p.id === updated.id ? updated : p));
      
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(PROFILES_LIST_STORAGE_KEY, JSON.stringify(updatedProfiles));
      } catch (err) {
        console.warn('Error al guardar profile en localStorage:', err);
      }
      return { activeProfile: updated, profiles: updatedProfiles };
    }),
  addProfile: (newProfile) =>
    set((state) => {
      const updatedProfiles = [...state.profiles, newProfile];
      try {
        localStorage.setItem(PROFILES_LIST_STORAGE_KEY, JSON.stringify(updatedProfiles));
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      } catch (err) {
        console.warn('Error al guardar profiles:', err);
      }
      return { profiles: updatedProfiles, activeProfile: newProfile };
    }),
  deleteProfile: (id) =>
    set((state) => {
      if (state.profiles.length <= 1) return state; // Mantener al menos uno
      const filtered = state.profiles.filter((p) => p.id !== id);
      const nextActive = state.activeProfile.id === id ? filtered[0] : state.activeProfile;
      try {
        localStorage.setItem(PROFILES_LIST_STORAGE_KEY, JSON.stringify(filtered));
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextActive));
      } catch (err) {
        console.warn('Error al eliminar profile:', err);
      }
      return { profiles: filtered, activeProfile: nextActive };
    }),
}));
