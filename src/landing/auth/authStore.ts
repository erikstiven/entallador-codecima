import { create } from 'zustand';

export interface CimaTexUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'Gratis' | 'Pro' | string;
  createdAt: string;
  provider: 'google';
  role?: string;
  lastLoginAt?: string;
}

export type GoogleAuthPayload =
  | string
  | (Partial<CimaTexUser> & {
      credential?: string;
      token?: string;
      idToken?: string;
    });

export interface AuthState {
  user: CimaTexUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  loginWithGoogle: (payload?: GoogleAuthPayload) => Promise<CimaTexUser>;
  logout: () => void;
}

export const STORAGE_KEY = 'cimatex_auth_user';
export const TOKEN_STORAGE_KEY = 'cimatex_auth_token';

function getStoredUser(): CimaTexUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error al leer usuario de localStorage:', err);
  }
  return null;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.warn('Error al leer token de localStorage:', err);
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: Boolean(getStoredUser()),
  isAuthModalOpen: false,
  isLoading: false,
  error: null,

  openAuthModal: () => set({ isAuthModalOpen: true, error: null }),
  closeAuthModal: () => set({ isAuthModalOpen: false, isLoading: false, error: null }),
  clearError: () => set({ error: null }),
  setError: (error: string | null) => set({ error }),

  loginWithGoogle: async (payload?: GoogleAuthPayload) => {
    set({ isLoading: true, error: null });

    const googleToken =
      typeof payload === 'string'
        ? payload
        : payload?.credential || payload?.token || payload?.idToken || `mock_google_token_${Date.now()}`;

    const profile =
      typeof payload === 'object' && payload !== null ? payload : undefined;

    // 1. Consumir API central en ${import.meta.env.VITE_API_URL || ''}/api/auth/google cuando esté configurada
    const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();

    if (configuredApiUrl) {
      try {
        const endpoint = configuredApiUrl.endsWith('/api')
          ? `${configuredApiUrl}/auth/google`
          : `${import.meta.env.VITE_API_URL || ''}/api/auth/google`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: googleToken,
            credential: googleToken,
            idToken: googleToken,
            profile,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const jwtToken: string | null = data.token || data.jwt || data.accessToken || null;
          const rawUser = data.user || data.data?.user || data;

          const centralUser: CimaTexUser = {
            id: String(rawUser.id || profile?.id || `usr_central_${Date.now()}`),
            name: String(rawUser.fullName || rawUser.name || profile?.name || 'Usuario CimaTex'),
            email: String(rawUser.email || profile?.email || 'usuario@codecima.com'),
            avatar: String(
              rawUser.avatarUrl ||
                rawUser.avatar ||
                profile?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            ),
            plan: (rawUser.plan as 'Gratis' | 'Pro') || 'Gratis',
            createdAt: String(rawUser.createdAt || rawUser.created_at || new Date().toISOString()),
            provider: 'google',
            role: rawUser.role,
            lastLoginAt: rawUser.lastLoginAt || rawUser.last_login_at,
          };

          if (jwtToken) {
            try {
              localStorage.setItem(TOKEN_STORAGE_KEY, jwtToken);
            } catch (err) {
              console.warn('Error al guardar token JWT en localStorage:', err);
            }
          }

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(centralUser));
          } catch (err) {
            console.warn('Error al guardar usuario en localStorage:', err);
          }

          set({
            user: centralUser,
            token: jwtToken,
            isAuthenticated: true,
            isLoading: false,
            isAuthModalOpen: false,
            error: null,
          });

          return centralUser;
        } else {
          console.warn(`[CimaTex Auth] La API central respondió con status ${response.status}. Activando fallback local.`);
        }
      } catch (networkError) {
        console.warn('[CimaTex Auth] API central no disponible o error de red, usando fallback local simulado:', networkError);
      }
    }

    // 2. Fallback elegante a usuario local simulado (desarrollo, demos, o modo offline)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const fallbackUser: CimaTexUser = {
      id: profile?.id || `usr_google_${Date.now()}`,
      name: profile?.name || 'Usuario CimaTex',
      email: profile?.email || 'usuario@codecima.com',
      avatar:
        profile?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      plan: 'Gratis',
      createdAt: new Date().toISOString(),
      provider: 'google',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
    } catch {}

    set({
      user: fallbackUser,
      token: null,
      isAuthenticated: true,
      isLoading: false,
      isAuthModalOpen: false,
      error: null,
    });

    return fallbackUser;
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
}));
