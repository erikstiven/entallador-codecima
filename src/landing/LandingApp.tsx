import React, { useEffect } from 'react';
import './styles/landing.css';
import {
  LanguageProvider,
  useLanguage,
  type Language,
} from './i18n/LanguageContext';
import { useAppRoute } from './router/landingRouteStore';
import { SUBPAGE_PATHS } from './data/subpagesData';

const LandingShellContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { mode, subpagePath, navigateTo } = useAppRoute();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('landing-active');
    root.style.colorScheme = 'light';
    document.body.classList.remove('overflow-hidden', 'select-none');

    return () => {
      root.classList.remove('landing-active');
    };
  }, []);

  const handleLanguageChange = (nextLang: Language) => {
    setLanguage(nextLang);
  };

  return (
    <div
      data-testid="landing-root"
      className="landing-root flex min-h-[100dvh] flex-col bg-background text-foreground"
    >
      {/* Header Shell (to be expanded 1:1 in TASK-3 via LandingHeader) */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-border/40">
        <div className="container flex h-20 items-center justify-between px-4 md:px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/');
            }}
            className="flex items-center gap-2 font-bold"
          >
            <img
              src="/subly-mark-teal.svg"
              alt="Sublimifyer"
              className="h-8 w-auto"
            />
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#soluciones"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/#soluciones');
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.solutions}
            </a>
            <a
              href="#beneficios"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/#beneficios');
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.benefits}
            </a>
            <a
              href="#demo"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/#demo');
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.demo}
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/#pricing');
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.pricing}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div
              role="group"
              aria-label={t.language.select}
              className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs"
            >
              {(['es', 'en', 'pt'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`rounded-full px-2 py-0.5 uppercase font-medium transition-colors ${
                    language === lang
                      ? 'bg-[#00857a] text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigateTo('/app')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.login}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('/app')}
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#00857a] hover:bg-[#00655d] px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {t.nav.getStarted}
            </button>
          </div>
        </div>
      </header>

      {mode === 'landing-subpage' && subpagePath ? (
        <main
          data-testid="landing-subpage-view"
          data-subpage={subpagePath}
          className="flex-1 container py-12 px-4 md:px-6"
        >
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#00857a] hover:underline"
          >
            ← {t.about.backToHome}
          </button>
          <h1 className="text-3xl font-bold tracking-tight">
            {subpagePath}
          </h1>
        </main>
      ) : (
        <main data-testid="landing-home-view" className="flex-1">
          <section className="py-16 md:py-24 container px-4 md:px-6 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              <span>{t.hero.titleLine1}</span>{' '}
              <span className="text-[#00857a]">{t.hero.titleLine2}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {t.hero.subtitle}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => navigateTo('/app')}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#00857a] hover:bg-[#00655d] px-8 text-base font-medium text-white shadow-lg transition-all"
              >
                {t.hero.getStarted}
              </button>
            </div>
          </section>

          <section id="soluciones" className="py-12 container px-4 md:px-6">
            <h2 className="text-2xl font-bold">{t.shirtShowcase.title}</h2>
          </section>

          <section id="beneficios" className="py-12 container px-4 md:px-6">
            <h2 className="text-2xl font-bold">
              {t.benefits.titleLine1} {t.benefits.titleLine2}
            </h2>
          </section>

          <section id="demo" className="py-12 container px-4 md:px-6">
            <h2 className="text-2xl font-bold">{t.appMock.title}</h2>
          </section>

          <section id="pricing" className="py-12 container px-4 md:px-6">
            <h2 className="text-2xl font-bold">{t.pricing.title}</h2>
          </section>

          <section id="cta" className="py-12 container px-4 md:px-6">
            <h2 className="text-2xl font-bold">{t.cta.title1}</h2>
            <button
              type="button"
              onClick={() => navigateTo('/app')}
              className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-[#00857a] hover:bg-[#00655d] px-8 text-base font-medium text-white"
            >
              {t.cta.getStarted}
            </button>
          </section>
        </main>
      )}

      <footer className="w-full border-t bg-[#020c0c] text-white/80 py-10">
        <div className="container px-4 md:px-6 flex flex-wrap gap-4 justify-between items-center text-xs">
          <span>© 2026 Sublimifyer. {t.footer.copyright}</span>
          <div className="flex flex-wrap gap-3">
            {SUBPAGE_PATHS.map((path) => (
              <a
                key={path}
                href={path}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(path);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                {path}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export const LandingApp: React.FC = () => {
  return (
    <LanguageProvider>
      <LandingShellContent />
    </LanguageProvider>
  );
};
