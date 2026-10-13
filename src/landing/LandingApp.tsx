import React, { useEffect } from 'react';
import './styles/landing.css';
import { LanguageProvider, type Language } from './i18n/LanguageContext';
import { useAppRoute } from './router/landingRouteStore';
import { LandingHeader } from './components/LandingHeader';
import { HeroSection } from './components/HeroSection';
import { SolutionsSection } from './components/SolutionsSection';
import { BenefitsSection } from './components/BenefitsSection';
import { DemoSection } from './components/DemoSection';
import { PricingSection, type PricingCurrency } from './components/PricingSection';
import { CtaSection } from './components/CtaSection';
import { LandingFooter } from './components/LandingFooter';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { SubpageView } from './pages/SubpageView';

export interface LandingAppProps {
  initialLanguage?: Language;
  initialCurrency?: PricingCurrency;
  forceWhatsAppVisible?: boolean;
}

const LandingShellContent: React.FC<{
  initialCurrency?: PricingCurrency;
  forceWhatsAppVisible?: boolean;
}> = ({ initialCurrency, forceWhatsAppVisible }) => {
  const { mode, subpagePath } = useAppRoute();

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
      {mode === 'landing-subpage' && subpagePath ? (
        <SubpageView subpagePath={subpagePath} />
      ) : (
        <>
          <LandingHeader />
          <main data-testid="landing-home-view" className="flex-1">
            <HeroSection />
            <SolutionsSection />
            <BenefitsSection />
            <DemoSection />

            {/* Unified Bottom Block (#pricing -> #cta -> Footer) with screen-blended white dot overlay */}
            <div
              data-testid="landing-unified-bottom-block"
              className="relative isolate"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1] mix-blend-screen bg-[size:22px_22px] bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)]"
              />
              <PricingSection initialCurrency={initialCurrency} />
              <CtaSection />
              <LandingFooter />
            </div>
          </main>
        </>
      )}

      <WhatsAppFloatingButton forceVisible={forceWhatsAppVisible} />
      <GoogleAuthModal />
    </div>
  );
};

export const LandingApp: React.FC<LandingAppProps> = ({
  initialLanguage,
  initialCurrency,
  forceWhatsAppVisible,
}) => {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <LandingShellContent
        initialCurrency={initialCurrency}
        forceWhatsAppVisible={forceWhatsAppVisible}
      />
    </LanguageProvider>
  );
};
