import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  detectBrowserLanguage,
  esTranslations,
  loadTranslations,
  SUPPORTED_LANGUAGES,
  translationsByLanguage,
  type LandingTranslations,
  type LanguageCode,
} from './translations';

export type Language = LanguageCode;
export type { LanguageCode, LandingTranslations };

export const LANGUAGE_STORAGE_KEY = 'language';

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: LandingTranslations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'es',
  setLanguage: () => undefined,
  t: esTranslations,
  isLoading: false,
});

export function isSupportedLanguage(value: unknown): value is Language {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

export function resolveInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isSupportedLanguage(stored)) {
        return stored;
      }
    } catch {
      // Fallback to browser language detection if localStorage is restricted
    }
  }
  return detectBrowserLanguage();
}

export interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<Language>(() =>
    initialLanguage && isSupportedLanguage(initialLanguage)
      ? initialLanguage
      : resolveInitialLanguage()
  );
  const [t, setT] = useState<LandingTranslations>(
    () => translationsByLanguage[language] ?? esTranslations
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setLanguage = useCallback((nextLang: Language) => {
    if (!isSupportedLanguage(nextLang)) return;
    setLanguageState(nextLang);
    setT(translationsByLanguage[nextLang] ?? esTranslations);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
      } catch {
        // Ignore storage errors in private/restricted contexts
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Immediately apply bundled dictionary so UI never flashes empty keys
    setT(translationsByLanguage[language] ?? esTranslations);

    if (language === 'es') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadTranslations(language)
      .then((loaded) => {
        if (!cancelled) {
          setT(loaded);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
    }),
    [language, setLanguage, t, isLoading]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
