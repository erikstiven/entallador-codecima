import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'hmb_theme';

function detectInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado); usar preferencia del sistema
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

/**
 * Tema de la aplicación. El modo claro se implementa remapeando la paleta de
 * Tailwind bajo la clase `html.light` (ver src/styles/globals.css), de modo que
 * todas las vistas existentes cambian de piel sin tocar su marcado.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: detectInitialTheme(),
  setTheme: (theme) => {
    set({ theme });
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Persistencia no disponible: el tema vive solo en la sesión
    }
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.style.colorScheme = theme;
}

// Aplicar el tema guardado antes del primer render para evitar el parpadeo
applyThemeToDocument(detectInitialTheme());
