import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppRoute } from '../router/landingRouteStore';

export const CTA_BOTTOM_FADE_GRADIENT =
  'linear-gradient(to bottom,\n  #06423e 0%, #06413d 8%, #06403c 16%, #063c39 24%, #063734 32%,\n  #05312e 40%, #042a28 48%, #042321 56%, #031c1b 64%, #031716 72%,\n  #031212 80%, #020f0f 88%, #020d0d 94%, #020c0c calc(100% - 12px))';

export const CtaSection: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const ctaRecord = t.cta as unknown as Record<string, string | undefined>;

  const title = ctaRecord.title ?? t.cta.title2 ?? t.cta.title1;
  const description = ctaRecord.description ?? t.cta.subtitle;
  const buttonLabel = ctaRecord.startTrial ?? t.cta.getStarted;

  return (
    <section
      id="cta"
      className="w-full -mt-px pt-px pb-64 md:pb-80 flex items-center bg-[#06423e] text-white relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 md:h-80"
        style={{
          background: CTA_BOTTOM_FADE_GRADIENT,
        }}
      />

      <div className="container relative z-10 flex h-[30vh] justify-center px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h3 className="text-3xl md:text-4xl lg:text-4xl tracking-tight text-white">
            {title}
          </h3>
          <p className="mx-auto max-w-[700px] text-white/80 md:text-xl">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              type="button"
              onClick={() => navigateTo('/app')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full h-12 px-8 text-base mt-1 bg-white text-[#06423e] hover:bg-white/90"
            >
              {buttonLabel}
              <ArrowRight className="ml-2 size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
