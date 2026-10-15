import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { HeroCardMarquee, type HeroMarqueeLabels } from './HeroCardMarquee';
import { useAuthStore } from '../auth/authStore';

export const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const { openAuthModal } = useAuthStore();
  const heroRecord = t.hero as unknown as Record<string, unknown>;
  const nestedCards = (heroRecord.cards ?? {}) as Record<string, string | undefined>;

  const labels: HeroMarqueeLabels = {
    sublimation:
      nestedCards.sublimation ?? t.hero.cardSublimation ?? 'Sublimación',
    dtf: nestedCards.dtf ?? t.hero.cardDtf ?? 'DTF',
    laserCut: nestedCards.laserCut ?? t.hero.cardLaserCut ?? 'Corte láser',
    orderTag: nestedCards.orderTag ?? t.hero.cardOrderTag ?? 'Pedido',
    orderStatus:
      nestedCards.orderStatus ?? t.hero.cardOrderStatus ?? 'En producción',
    orderClient:
      nestedCards.orderClient ??
      t.hero.cardOrderClient ??
      'Club Atlético Progreso',
    orderItem:
      nestedCards.orderItem ??
      t.hero.cardOrderItem ??
      'Camiseta rayada · Sublimación',
    orderQtyLabel:
      nestedCards.orderQtyLabel ?? t.hero.cardOrderQtyLabel ?? 'Cantidad',
    orderQtyValue:
      nestedCards.orderQtyValue ?? t.hero.cardOrderQtyValue ?? '24 u.',
    orderDueLabel:
      nestedCards.orderDueLabel ?? t.hero.cardOrderDueLabel ?? 'Entrega',
    orderDueValue:
      nestedCards.orderDueValue ?? t.hero.cardOrderDueValue ?? '22 ago',
    usageTag: nestedCards.usageTag ?? t.hero.cardUsageTag ?? 'Consumo',
    usageLabel:
      nestedCards.usageLabel ?? t.hero.cardUsageLabel ?? 'Papel · 7 días',
    usageValue: nestedCards.usageValue ?? t.hero.cardUsageValue ?? '18,4 m',
    usagePeriod:
      nestedCards.usagePeriod ?? t.hero.cardUsagePeriod ?? 'esta sem.',
    patternTag: nestedCards.patternTag ?? t.hero.cardPatternTag ?? 'Moldería',
    patternPiece:
      nestedCards.patternPiece ?? t.hero.cardPatternPiece ?? 'DELANTERO',
    patternSize: nestedCards.patternSize ?? t.hero.cardPatternSize ?? 'M',
    trackTag: nestedCards.trackTag ?? t.hero.cardTrackTag ?? 'Seguimiento',
    trackSteps: [
      nestedCards.trackStep1 ?? t.hero.cardTrackStep1 ?? 'Recibido',
      nestedCards.trackStep2 ?? t.hero.cardTrackStep2 ?? 'Diseño',
      nestedCards.trackStep3 ?? t.hero.cardTrackStep3 ?? 'Impresión',
      nestedCards.trackStep4 ?? t.hero.cardTrackStep4 ?? 'Confección',
      nestedCards.trackStep5 ?? t.hero.cardTrackStep5 ?? 'Entrega',
    ],
    mixTag: nestedCards.mixTag ?? t.hero.cardMixTag ?? 'Producción',
    mixLabel: nestedCards.mixLabel ?? t.hero.cardMixLabel ?? 'Mix del mes',
    mixTotalLabel:
      nestedCards.mixTotalLabel ?? t.hero.cardMixTotalLabel ?? 'pedidos',
    mixSlices: [
      nestedCards.mix1 ?? t.hero.cardMix1 ?? 'Sublimación',
      nestedCards.mix2 ?? t.hero.cardMix2 ?? 'DTF',
      nestedCards.mix3 ?? t.hero.cardMix3 ?? 'Corte',
    ],
    productTag: nestedCards.productTag ?? t.hero.cardProductTag ?? 'Producto',
    productName:
      nestedCards.productName ?? t.hero.cardProductName ?? 'Short oficial',
    productParts:
      nestedCards.productParts ??
      t.hero.cardProductParts ??
      'Izquierda + derecha',
  };

  const heroDescription =
    (heroRecord.description as string | undefined) ?? t.hero.subtitle;

  return (
    <section className="w-full overflow-hidden">
      <div className="relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 bg-[radial-gradient(#00000010_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff12_1px,transparent_1px)] bg-[size:14px_14px]">
        {/* Physics card marquee */}
        <div className="hidden" aria-hidden="true">
          <HeroCardMarquee labels={labels} />
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 -bottom-px z-30 h-16 w-full md:h-20 [filter:drop-shadow(0_-4px_8px_rgba(0,0,0,0.07))]"
        >
          <path
            d="M0,70 L0,34 C240,4 480,58 720,42 C960,26 1200,0 1440,26 L1440,70 Z"
            fill="hsl(var(--background))"
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-5xl mx-auto min-h-[calc(85svh-7rem)] px-4 pt-16 pb-24 md:pb-32">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="block text-foreground">
              {t.hero.titleLine1 ?? t.hero.title}
            </span>
            {t.hero.titleLine2 && (
              <span className="block text-[color:var(--hero-accent)]">
                {t.hero.titleLine2}
              </span>
            )}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            {heroDescription}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={openAuthModal}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 text-sm sm:text-base font-semibold inline-flex items-center justify-center transition-all shadow-lg hover:shadow-primary/30 active:scale-95 cursor-pointer"
            >
              <span>Comenzar gratis con Google</span>
              <ChevronRight className="ml-1 size-5" />
            </button>
            <a
              href="#demo"
              className="rounded-full bg-background/80 hover:bg-background border border-border/60 text-foreground h-12 px-6 text-sm font-medium inline-flex items-center justify-center transition-colors shadow-xs"
            >
              <span>Ver cómo funciona</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
