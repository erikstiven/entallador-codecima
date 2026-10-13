import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  isSubpagePath,
  navigateTo,
  parseAppRoute,
  useLandingRouteStore,
} from './router/landingRouteStore';
import { SUBPAGE_PATHS } from './data/subpagesData';
import {
  isSupportedLanguage,
  resolveInitialLanguage,
} from './i18n/LanguageContext';

describe('TASK-2: Architectural Separation, Routing (/ & /landing vs /app), i18n & CSS Isolation', () => {
  it('routes / and /landing to landing-home and /app to workshop', () => {
    expect(parseAppRoute('/', '')).toEqual({
      mode: 'landing-home',
      pathname: '/',
      hash: '',
      subpagePath: null,
    });

    expect(parseAppRoute('/landing', '#pricing')).toEqual({
      mode: 'landing-home',
      pathname: '/landing',
      hash: '#pricing',
      subpagePath: null,
    });

    expect(parseAppRoute('/app', '')).toEqual({
      mode: 'workshop',
      pathname: '/app',
      hash: '',
      subpagePath: null,
    });

    expect(parseAppRoute('/', '#/app')).toEqual({
      mode: 'workshop',
      pathname: '/app',
      hash: '',
      subpagePath: null,
    });
  });

  it('routes all 11 subpage paths and /landing/<subpage> variants to landing-subpage', () => {
    for (const subpage of SUBPAGE_PATHS) {
      expect(isSubpagePath(subpage)).toBe(true);

      const direct = parseAppRoute(subpage, '');
      expect(direct.mode).toBe('landing-subpage');
      expect(direct.subpagePath).toBe(subpage);

      const prefixed = parseAppRoute(`/landing${subpage}`, '');
      expect(prefixed.mode).toBe('landing-subpage');
      expect(prefixed.subpagePath).toBe(subpage);
    }
  });

  it('updates landingRouteStore state via navigateTo across home, subpages, anchors, and /app', () => {
    navigateTo('/documentation');
    expect(useLandingRouteStore.getState().mode).toBe('landing-subpage');
    expect(useLandingRouteStore.getState().subpagePath).toBe('/documentation');

    navigateTo('/#soluciones');
    expect(useLandingRouteStore.getState().mode).toBe('landing-home');
    expect(useLandingRouteStore.getState().pathname).toBe('/');
    expect(useLandingRouteStore.getState().hash).toBe('#soluciones');

    navigateTo('/app');
    expect(useLandingRouteStore.getState().mode).toBe('workshop');
    expect(useLandingRouteStore.getState().pathname).toBe('/app');

    navigateTo('/');
    expect(useLandingRouteStore.getState().mode).toBe('landing-home');
  });

  it('validates supported languages and resolves initial language fallback', () => {
    expect(isSupportedLanguage('es')).toBe(true);
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('pt')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
    expect(['es', 'en', 'pt']).toContain(resolveInitialLanguage());
  });

  it('defines isolated Sublimifyer CSS tokens in src/landing/styles/landing.css', () => {
    const cssPath = path.resolve(
      process.cwd(),
      'src/landing/styles/landing.css'
    );
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--primary: 175 100% 26%');
    expect(css).toContain('--hero-accent: #00857a');
    expect(css).toContain('--primary-dark: #00655d');
    expect(css).toContain('--radius: 1rem');
    expect(css).toContain('.landing-root');
    expect(css).toContain('html.landing-active');
  });
});
