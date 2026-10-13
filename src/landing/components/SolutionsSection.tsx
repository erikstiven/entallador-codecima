import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const SolutionsSection: React.FC = () => {
  const { t } = useLanguage();
  const showcaseRecord = (t.shirtShowcase ?? {}) as Record<
    string,
    string | undefined
  >;
  const subtitle = showcaseRecord.subtitle ?? t.shirtShowcase?.description;

  return (
    <div id="soluciones" className="scroll-mt-16">
      <section className="w-full py-20 md:py-32">
        <div className="container px-4 md:px-6">
          {t.shirtShowcase?.title && (
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t.shirtShowcase.title}
              </h2>
              {subtitle && (
                <p className="mt-4 text-base md:text-lg text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border/40 shadow-2xl">
            <video
              src="/shirt-scroll/sublimifyer-scroll.mp4"
              className="pointer-events-none block w-full"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controlsList="nodownload noplaybackrate noremoteplayback"
              ref={(el) => {
                if (el) {
                  el.playbackRate = 1.5;
                }
              }}
              onLoadedMetadata={(e) => {
                e.currentTarget.playbackRate = 1.5;
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
