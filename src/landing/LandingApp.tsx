import React, { useEffect } from 'react';
import './styles/landing.css';
import {
  LanguageProvider,
  useLanguage,
} from './i18n/LanguageContext';
import { useAppRoute } from './router/landingRouteStore';
import { SUBPAGE_PATHS } from './data/subpagesData';
import { LandingHeader } from './components/LandingHeader';
import { HeroSection } from './components/HeroSection';
import { SolutionsSection } from './components/SolutionsSection';
import { BenefitsSection } from './components/BenefitsSection';
import { DemoSection } from './components/DemoSection';

const LandingShellContent: React.FC = () => {
  const { t } = useLanguage();
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

  return (
    <div
      data-testid="landing-root"
      className="landing-root flex min-h-[100dvh] flex-col bg-background text-foreground"
    >
      <LandingHeader />

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
          <HeroSection />
          <SolutionsSection />
          <BenefitsSection />
          <DemoSection />

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
