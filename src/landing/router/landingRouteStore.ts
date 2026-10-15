import { useEffect } from 'react';
import { create } from 'zustand';
import { SUBPAGE_PATHS, type SubpagePath } from '../data/subpagesData';

export type AppRouteMode = 'landing-home' | 'landing-subpage' | 'workshop';

export interface AppRouteState {
  mode: AppRouteMode;
  pathname: string;
  hash: string;
  subpagePath: SubpagePath | null;
}

export function isSubpagePath(path: string): path is SubpagePath {
  return (SUBPAGE_PATHS as readonly string[]).includes(path);
}

export function normalizePathname(rawPathname: string): string {
  if (!rawPathname) return '/';
  const trimmed = rawPathname.trim();
  if (trimmed === '' || trimmed === '/') return '/';
  const withoutTrailing = trimmed.endsWith('/')
    ? trimmed.slice(0, -1)
    : trimmed;
  return withoutTrailing.startsWith('/')
    ? withoutTrailing
    : `/${withoutTrailing}`;
}

export function parseAppRoute(
  rawPathname: string = typeof window !== 'undefined'
    ? window.location.pathname
    : '/',
  rawHash: string = typeof window !== 'undefined' ? window.location.hash : ''
): AppRouteState {
  const pathname = normalizePathname(rawPathname);
  const hash = rawHash || '';

  // Support both pathname `/app` and hash `#/app`
  if (
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    hash === '#/app' ||
    hash.startsWith('#/app/')
  ) {
    return {
      mode: 'workshop',
      pathname: '/app',
      hash: '',
      subpagePath: null,
    };
  }

  // Support hash-based subpage fallback (e.g. `#/documentation`)
  if (hash.startsWith('#/')) {
    const hashPath = normalizePathname(hash.slice(1));
    if (isSubpagePath(hashPath)) {
      return {
        mode: 'landing-subpage',
        pathname: hashPath,
        hash: '',
        subpagePath: hashPath,
      };
    }
  }

  // Direct subpage path (`/documentation`, `/about`, etc.)
  if (isSubpagePath(pathname)) {
    return {
      mode: 'landing-subpage',
      pathname,
      hash,
      subpagePath: pathname,
    };
  }

  // Support `/landing/<subpage>` prefix
  if (pathname.startsWith('/landing/')) {
    const stripped = normalizePathname(pathname.slice('/landing'.length));
    if (isSubpagePath(stripped)) {
      return {
        mode: 'landing-subpage',
        pathname: stripped,
        hash,
        subpagePath: stripped,
      };
    }
  }

  // Default: Landing Home (`/` or `/landing`)
  return {
    mode: 'landing-home',
    pathname: pathname === '/landing' ? '/landing' : '/',
    hash,
    subpagePath: null,
  };
}

interface RouteStore extends AppRouteState {
  syncFromLocation: () => void;
  setRoute: (next: AppRouteState) => void;
}

export const useLandingRouteStore = create<RouteStore>((set) => ({
  ...parseAppRoute(),
  syncFromLocation: () => {
    set(parseAppRoute());
  },
  setRoute: (next) => {
    set(next);
  },
}));

function scrollToSectionHash(hash: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const cleanId = hash.replace(/^#/, '').trim();
  if (!cleanId) return;

  const attemptScroll = (retriesLeft: number) => {
    const targetEl = document.getElementById(cleanId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (retriesLeft > 0) {
      window.setTimeout(() => attemptScroll(retriesLeft - 1), 50);
    }
  };

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => attemptScroll(6));
  } else {
    attemptScroll(3);
  }
}

export function navigateTo(target: string): void {
  if (!target) return;

  let nextPathname = '/';
  let nextHash = '';

  if (target.startsWith('#')) {
    // Pure anchor navigation on landing home (e.g. `#soluciones`)
    const current = useLandingRouteStore.getState();
    nextPathname =
      current.mode === 'landing-home' && current.pathname === '/landing'
        ? '/landing'
        : '/';
    nextHash = target;
  } else {
    const hashIndex = target.indexOf('#');
    if (hashIndex !== -1) {
      nextPathname = normalizePathname(target.slice(0, hashIndex) || '/');
      nextHash = target.slice(hashIndex);
    } else {
      nextPathname = normalizePathname(target);
      nextHash = '';
    }
  }

  const nextRoute = parseAppRoute(nextPathname, nextHash);

  if (typeof window !== 'undefined' && window.history?.pushState) {
    const url = `${nextRoute.pathname}${nextRoute.hash}`;
    try {
      window.history.pushState({}, '', url);
    } catch {
      // Ignore pushState errors in restricted/file environments
    }
  }

  useLandingRouteStore.getState().setRoute(nextRoute);

  if (typeof window !== 'undefined') {
    if (nextRoute.mode === 'landing-home' && nextRoute.hash) {
      scrollToSectionHash(nextRoute.hash);
    } else if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }
}

let listenersRefCount = 0;
let removeGlobalListeners: (() => void) | null = null;

function attachGlobalListeners(syncFromLocation: () => void) {
  listenersRefCount++;
  if (listenersRefCount === 1) {
    const handleLocationChange = () => {
      syncFromLocation();
      const currentHash = window.location.hash;
      if (currentHash && !currentHash.startsWith('#/')) {
        scrollToSectionHash(currentHash);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    removeGlobalListeners = () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }
}

function detachGlobalListeners() {
  listenersRefCount = Math.max(0, listenersRefCount - 1);
  if (listenersRefCount === 0 && removeGlobalListeners) {
    removeGlobalListeners();
    removeGlobalListeners = null;
  }
}

export function useAppRoute(): AppRouteState & {
  navigateTo: (target: string) => void;
} {
  const mode = useLandingRouteStore((state) => state.mode);
  const pathname = useLandingRouteStore((state) => state.pathname);
  const hash = useLandingRouteStore((state) => state.hash);
  const subpagePath = useLandingRouteStore((state) => state.subpagePath);
  const syncFromLocation = useLandingRouteStore(
    (state) => state.syncFromLocation
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    attachGlobalListeners(syncFromLocation);
    return () => {
      detachGlobalListeners();
    };
  }, [syncFromLocation]);

  const snapshot =
    typeof window === 'undefined' ? useLandingRouteStore.getState() : null;

  return {
    mode: snapshot ? snapshot.mode : mode,
    pathname: snapshot ? snapshot.pathname : pathname,
    hash: snapshot ? snapshot.hash : hash,
    subpagePath: snapshot ? snapshot.subpagePath : subpagePath,
    navigateTo,
  };
}
