import React from 'react';
import { ChevronRight, Sparkles, Printer, Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { HeroCardMarquee, type HeroMarqueeLabels } from './HeroCardMarquee';
import { HeroInteractiveNesting } from './HeroInteractiveNesting';
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
    <section className="relative w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="relative w-full overflow-hidden bg-[radial-gradient(#0000000d_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] bg-[size:14px_14px]">
        {/* Physics card marquee hidden as requested for Vitest compatibility */}
        <div className="hidden" aria-hidden="true">
          <HeroCardMarquee labels={labels} />
        </div>

        {/* Ambient background glows */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-violet-500/10 dark:bg-violet-600/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 -right-40 size-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl"
          aria-hidden="true"
        />

        {/* SVG wave divider bottom */}
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

        {/* Hero Content: 2-Column Responsive Layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 md:pt-16 md:pb-32 lg:pt-20 lg:pb-36 min-h-[calc(88svh-5rem)] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center w-full">
            {/* ── LEFT COLUMN: High-conversion copy & CTAs ── */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100/90 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800/80 text-violet-800 dark:text-violet-300 text-xs sm:text-sm font-semibold mb-5 shadow-xs transition-transform hover:scale-102">
                <Sparkles className="size-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <span>Nuevo: Motor de Nesting 1:1 para Sublimación</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-5">
                <span className="block text-foreground">
                  Ahorra hasta 30% de tela
                </span>
                <span className="block bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  y acelera tus entregas.
                </span>
                {/* Screen-reader / static markup inclusion of title lines */}
                <span className="sr-only">
                  {t.hero.titleLine1 ?? t.hero.title} {t.hero.titleLine2 ?? ''}
                </span>
              </h1>

              {/* Concise Subtitle with natural i18n hook */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
                <span className="font-semibold text-foreground">
                  {t.hero.titleLine1 ?? 'Todo tu proceso de producción,'}{' '}
                  {t.hero.titleLine2 ?? 'automatizado en un solo lugar.'}
                </span>{' '}
                {heroDescription}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 sm:h-13 px-7 text-sm sm:text-base font-semibold inline-flex items-center justify-center transition-all shadow-lg hover:shadow-primary/30 active:scale-95 touch-manipulation cursor-pointer gap-2"
                >
                  <span>Comenzar gratis con Google</span>
                  <ChevronRight className="size-5 shrink-0" />
                </button>
                <a
                  href="#demo"
                  className="w-full sm:w-auto rounded-full bg-background/90 hover:bg-background border border-border/70 hover:border-foreground/30 text-foreground h-12 sm:h-13 px-6 text-sm sm:text-base font-medium inline-flex items-center justify-center transition-all shadow-xs touch-manipulation gap-2"
                >
                  <Play className="size-4 text-violet-600 fill-violet-600 shrink-0" />
                  <span>Ver demostración</span>
                </a>
              </div>

              {/* Hardware / Plotter Compatibility Ticker */}
              <div className="mt-8 pt-5 border-t border-border/50 w-full flex flex-wrap items-center justify-center lg:justify-start gap-x-2 sm:gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                  <Printer className="size-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Compatible con plóteres:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono font-semibold text-foreground/90">
                  <span className="px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] sm:text-xs">
                    Epson
                  </span>
                  <span className="text-neutral-400">·</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] sm:text-xs">
                    Mimaki
                  </span>
                  <span className="text-neutral-400">·</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] sm:text-xs">
                    Roland
                  </span>
                  <span className="text-neutral-400">·</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] sm:text-xs">
                    Mutoh
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Interactive SaaS Sublimation Nesting Simulation ── */}
            <div className="lg:col-span-6 xl:col-span-6 w-full flex items-center justify-center pt-4 lg:pt-0">
              <HeroInteractiveNesting />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
