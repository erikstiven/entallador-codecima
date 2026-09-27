import { create } from 'zustand';
import { ProductionProfile } from '@/core/geometry/types';

interface ProfileState {
  profiles: ProductionProfile[];
  activeProfile: ProductionProfile;
  setActiveProfile: (profile: ProductionProfile) => void;
  updateActiveProfile: (updates: Partial<ProductionProfile>) => void;
}

const DEFAULT_PROFILES: ProductionProfile[] = [
  {
    id: 'profile_epson_122',
    name: 'Epson 122cm (Área Útil 112cm)',
    totalRollWidthMm: 1220.0,
    leftMarginMm: 50.0,
    rightMarginMm: 50.0,
    printableWidthMm: 1120.0,
    pieceSpacingMm: 7.0,
    topMarginMm: 10.0,
    bottomMarginMm: 10.0,
  },
  {
    id: 'profile_epson_160',
    name: 'Epson 160cm (Área Útil 150cm)',
    totalRollWidthMm: 1600.0,
    leftMarginMm: 50.0,
    rightMarginMm: 50.0,
    printableWidthMm: 1500.0,
    pieceSpacingMm: 7.0,
    topMarginMm: 10.0,
    bottomMarginMm: 10.0,
  },
  {
    id: 'profile_epson_110',
    name: 'Epson 110cm (Área Útil 100cm)',
    totalRollWidthMm: 1100.0,
    leftMarginMm: 50.0,
    rightMarginMm: 50.0,
    printableWidthMm: 1000.0,
    pieceSpacingMm: 7.0,
    topMarginMm: 10.0,
    bottomMarginMm: 10.0,
  },
];

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: DEFAULT_PROFILES,
  activeProfile: DEFAULT_PROFILES[0],
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  updateActiveProfile: (updates) =>
    set((state) => {
      const updated = { ...state.activeProfile, ...updates };
      // Recalcular área útil si cambian anchos o márgenes
      if (
        updates.totalRollWidthMm !== undefined ||
        updates.leftMarginMm !== undefined ||
        updates.rightMarginMm !== undefined
      ) {
        updated.printableWidthMm =
          updated.totalRollWidthMm - (updated.leftMarginMm + updated.rightMarginMm);
      }
      return { activeProfile: updated };
    }),
}));
