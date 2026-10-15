import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { CimaTexAppMockV2 } from './CimaTexAppMockV2';

export const DemoSection: React.FC = () => {
  const { t } = useLanguage();

  const appMockRecord = (t.appMock ?? {}) as Record<string, string | undefined>;
  const subtitle = appMockRecord.subtitle ?? t.appMock?.description;

  return (
    <section
      id="demo"
      className="relative z-10 scroll-mt-16 w-full pt-16 sm:pt-20 md:pt-32"
      style={{
        background: 'linear-gradient(to bottom, #ffffff 0%, #fbfbfc 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[size:22px_22px] mix-blend-multiply"
        style={{
          backgroundImage:
            'radial-gradient(rgba(124,58,237,0.12) 1px, transparent 1px)',
          backgroundPosition: 'bottom left',
          maskImage:
            'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.5) 70%, #000)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.5) 70%, #000)',
        }}
      />

      {t.appMock?.title && (
        <div className="container px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              {t.appMock.title}
            </h2>
            {subtitle && (
              <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-[1280px] overflow-hidden rounded-t-xl border border-b-0 border-black/10 bg-muted/60 shadow-2xl [container-type:inline-size] max-[1328px]:w-[calc(100%-1.5rem)] sm:max-[1328px]:w-[calc(100%-2rem)]">
        <div className="flex h-[clamp(24px,3.15cqw,40px)] items-center gap-[clamp(6px,1.1cqw,14px)] px-[clamp(8px,1.25cqw,16px)]">
          <div className="flex items-center gap-[clamp(4px,0.6cqw,8px)]">
            <span className="block size-[clamp(6px,0.94cqw,12px)] rounded-full bg-[#FF5F57]" />
            <span className="block size-[clamp(6px,0.94cqw,12px)] rounded-full bg-[#FEBC2E]" />
            <span className="block size-[clamp(6px,0.94cqw,12px)] rounded-full bg-[#28C840]" />
          </div>
          {t.appMock?.live && (
            <span className="ml-auto flex items-center gap-[clamp(3px,0.47cqw,6px)] text-[clamp(6px,0.78cqw,10px)] font-medium uppercase leading-none tracking-[0.14em] text-primary">
              <span className="block size-[clamp(3px,0.47cqw,6px)] animate-pulse rounded-full bg-primary" />
              {t.appMock.live}
            </span>
          )}
        </div>

        <div className="w-full border-t border-black/10 bg-background">
          <CimaTexAppMockV2 />
          <iframe
            src="/app-mock.html#designer"
            title="CimaTex"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};
