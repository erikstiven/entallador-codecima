import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppRoute } from '../router/landingRouteStore';
import { useAuthStore } from '../auth/authStore';

export const CTA_BOTTOM_FADE_GRADIENT =
  'linear-gradient(to bottom,\n  #180d33 0%, #170c31 8%, #160c2e 16%, #150b2c 24%, #130a29 32%,\n  #120a27 40%, #110925 48%, #100822 56%, #0f0720 64%, #0e071e 72%,\n  #0c061b 80%, #0b0519 88%, #0a0516 94%, #090414 calc(100% - 12px))';

export const CtaSection: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const { openAuthModal } = useAuthStore();
  const ctaRecord = t.cta as unknown as Record<string, string | undefined>;

  const title = ctaRecord.title ?? t.cta.title2 ?? t.cta.title1;
  const description = ctaRecord.description ?? t.cta.subtitle;
  const buttonLabel = ctaRecord.startTrial ?? t.cta.getStarted;

  return (
    <section
      id="cta"
      className="w-full -mt-px pt-px pb-64 md:pb-80 flex items-center bg-[#180d33] text-white relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 md:h-80"
        style={{
          background: CTA_BOTTOM_FADE_GRADIENT,
        }}
      />

      <div className="container relative z-10 flex min-h-[32vh] justify-center px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-5 text-center">
          <div className="relative mb-1">
            <img
              src="/cimatex-mascota.webp"
              alt="Mascota CimaTex"
              width={140}
              height={140}
              className="h-28 md:h-36 w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h3 className="text-3xl md:text-4xl lg:text-4xl font-bold tracking-tight text-white">
            {title}
          </h3>
          <p className="mx-auto max-w-[700px] text-white/80 md:text-xl">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full h-12 px-8 text-base mt-1 bg-white text-[#180d33] hover:bg-white/90 shadow-lg cursor-pointer"
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
