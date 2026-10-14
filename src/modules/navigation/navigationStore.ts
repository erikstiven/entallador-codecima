import { create } from 'zustand';

export type AppView = 
  | 'NEW_ORDER' 
  | 'DESIGNS' 
  | 'PATTERNS' 
  | 'NESTING' 
  | 'HISTORY' 
  | 'SETTINGS';

export const STORAGE_COLLAPSED_KEY = 'cimatex_sidebar_collapsed';

const getInitialCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

interface NavigationState {
  currentView: AppView;
  isNestingPreviewMode: boolean;
  isSidebarCollapsed: boolean;
  setCurrentView: (view: AppView) => void;
  setNestingPreviewMode: (active: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'NEW_ORDER',
  isNestingPreviewMode: false,
  isSidebarCollapsed: getInitialCollapsed(),
  setCurrentView: (view) => set({
    currentView: view,
    ...(view === 'NESTING' ? {} : { isNestingPreviewMode: false }),
  }),
  setNestingPreviewMode: (active) => set({ isNestingPreviewMode: active }),
  toggleSidebarCollapsed: () => set((state) => {
    const next = !state.isSidebarCollapsed;
    try {
      localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
    } catch {}
    return { isSidebarCollapsed: next };
  }),
  setSidebarCollapsed: (collapsed) => {
    try {
      localStorage.setItem(STORAGE_COLLAPSED_KEY, String(collapsed));
    } catch {}
    set({ isSidebarCollapsed: collapsed });
  },
}));
