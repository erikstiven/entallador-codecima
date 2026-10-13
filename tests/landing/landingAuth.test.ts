import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore, STORAGE_KEY, TOKEN_STORAGE_KEY } from '../../src/landing/auth/authStore';
import { GoogleAuthModal } from '../../src/landing/components/GoogleAuthModal';

// Mock localStorage para entorno de pruebas de Node/Vitest
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('Integración Frontend y Autenticación CimaTex (authStore & GoogleAuthModal)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnvApi = import.meta.env.VITE_API_URL;

  beforeEach(() => {
    storageMock.clear();
    useAuthStore.getState().logout();
    useAuthStore.setState({ isAuthModalOpen: false, isLoading: false, error: null });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    import.meta.env.VITE_API_URL = originalEnvApi;
  });

  it('1. En modo local/offline sin VITE_API_URL, ejecuta el fallback elegante y persiste el usuario local', async () => {
    import.meta.env.VITE_API_URL = '';

    const user = await useAuthStore.getState().loginWithGoogle({
      name: 'Diseñador Local',
      email: 'local@cimatex.com',
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('Diseñador Local');
    expect(user.email).toBe('local@cimatex.com');
    expect(user.provider).toBe('google');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.name).toBe('Diseñador Local');
    expect(state.token).toBeNull();

    // Verificamos almacenamiento en localStorage
    const stored = JSON.parse(storageMock.getItem(STORAGE_KEY) || '{}');
    expect(stored.email).toBe('local@cimatex.com');
  });

  it('2. Cuando VITE_API_URL está configurada y la API responde exitosamente, almacena el token JWT y el perfil de la BD central', async () => {
    import.meta.env.VITE_API_URL = 'http://localhost:4000';

    const mockApiResponse = {
      success: true,
      token: 'jwt-header.payload.signature-central-db',
      user: {
        id: 'usr_central_999',
        fullName: 'Patronista Central Hostinger',
        email: 'patronista@codecima.com',
        avatarUrl: 'https://cimatex.codecima.com/avatar.jpg',
        plan: 'Pro',
        role: 'operator',
        lastLoginAt: '2026-10-13T12:00:00Z',
      },
    };

    let requestedUrl = '';
    let requestBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      requestedUrl = url;
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      };
    }) as any;

    const user = await useAuthStore.getState().loginWithGoogle({
      credential: 'google-client-credential-xyz',
      name: 'Nombre Temporal',
    });

    // Verifica que se consumió el endpoint correcto enviando la credencial
    expect(requestedUrl).toBe('http://localhost:4000/api/auth/google');
    expect(requestBody.credential).toBe('google-client-credential-xyz');

    // Verifica que el estado y localStorage guardaron el JWT y el perfil devuelto por la base de datos central
    expect(user.id).toBe('usr_central_999');
    expect(user.name).toBe('Patronista Central Hostinger');
    expect(user.email).toBe('patronista@codecima.com');
    expect(user.plan).toBe('Pro');
    expect(user.role).toBe('operator');

    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt-header.payload.signature-central-db');
    expect(storageMock.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-header.payload.signature-central-db');

    const storedUser = JSON.parse(storageMock.getItem(STORAGE_KEY) || '{}');
    expect(storedUser.id).toBe('usr_central_999');
    expect(storedUser.name).toBe('Patronista Central Hostinger');
  });

  it('3. Si la API central está caída o falla la red, activa el fallback elegante sin romper el flujo de la app', async () => {
    import.meta.env.VITE_API_URL = 'http://localhost:4000';

    // Simular error de red (ej. Network Connection Refused en fetch)
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch (ERR_CONNECTION_REFUSED)'));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const user = await useAuthStore.getState().loginWithGoogle({
      name: 'Usuario en Modo Desconectado',
      email: 'offline@codecima.com',
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('Usuario en Modo Desconectado');
    expect(user.email).toBe('offline@codecima.com');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('4. logout limpia completamente el usuario y token tanto en store como en localStorage', () => {
    storageMock.setItem(STORAGE_KEY, JSON.stringify({ id: 'u1', name: 'Demo' }));
    storageMock.setItem(TOKEN_STORAGE_KEY, 'sample-jwt-token');

    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Demo',
        email: 'demo@test.com',
        avatar: '',
        plan: 'Gratis',
        createdAt: '',
        provider: 'google',
      },
      token: 'sample-jwt-token',
      isAuthenticated: true,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(storageMock.getItem(STORAGE_KEY)).toBeNull();
    expect(storageMock.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('5. GoogleAuthModal muestra el texto exacto de carga "Conectando con Google y base de datos..." cuando isLoading es true', () => {
    const html = renderToStaticMarkup(
      React.createElement(GoogleAuthModal, { isOpen: true, isLoading: true })
    );
    expect(html).toContain('Conectando con Google y base de datos...');
  });

  it('6. GoogleAuthModal muestra un mensaje de error amigable cuando se presenta un error de conexión', () => {
    const html = renderToStaticMarkup(
      React.createElement(GoogleAuthModal, {
        isOpen: true,
        isLoading: false,
        error: 'No se pudo conectar con el servidor central. Verifique su red.',
      })
    );
    expect(html).toContain('Aviso de conexión');
    expect(html).toContain('No se pudo conectar con el servidor central. Verifique su red.');
  });
});
