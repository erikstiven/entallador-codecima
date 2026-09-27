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
  setCurrentView: (view: AppView) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'NEW_ORDER',
  setCurrentView: (view) => set({ currentView: view }),
}));
