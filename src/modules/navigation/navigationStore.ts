import { create } from 'zustand';

export type AppView = 
  | 'NEW_ORDER' 
  | 'DESIGNS' 
  | 'PATTERNS' 
  | 'NESTING' 
  | 'HISTORY' 
  | 'SETTINGS';

interface NavigationState {
  currentView: AppView;
  isNestingPreviewMode: boolean;
  setCurrentView: (view: AppView) => void;
  setNestingPreviewMode: (active: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'NEW_ORDER',
  isNestingPreviewMode: false,
  setCurrentView: (view) => set({
    currentView: view,
    ...(view === 'NESTING' ? {} : { isNestingPreviewMode: false }),
  }),
  setNestingPreviewMode: (active) => set({ isNestingPreviewMode: active }),
}));
