import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'cimatex_theme';
const LEGACY_STORAGE_KEY = 'hmb_theme';

function detectInitialTheme(): ThemeMode {
  return 'light';
}

/**
 * Tema de la aplicación. Estandarizado en modo claro (Light Mode)
 * para garantizar visualización y calibración textil fiel.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    set({ theme: 'light' });
    applyThemeToDocument('light');
    try {
      localStorage.setItem(STORAGE_KEY, 'light');
    } catch {
      // Ignorar error de almacenamiento
    }
  },
  toggleTheme: () => get().setTheme('light'),
}));

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (root.classList.contains('landing-active')) {
    root.classList.remove('light');
    root.style.colorScheme = 'light';
    return;
  }
  root.classList.add('light');
  root.style.colorScheme = 'light';
}

// Aplicar el tema guardado antes del primer render únicamente si estamos en /app
if (
  typeof window !== 'undefined' &&
  (window.location.pathname === '/app' ||
    window.location.pathname.startsWith('/app/') ||
    window.location.hash.startsWith('#/app'))
) {
  applyThemeToDocument(detectInitialTheme());
}
