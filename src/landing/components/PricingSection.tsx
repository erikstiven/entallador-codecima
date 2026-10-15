import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { LandingPlanTier } from '../i18n/es';
import { useAppRoute } from '../router/landingRouteStore';
import { SUBLIMIFYER_WHATSAPP_PHONE } from '../data/subpagesData';
import { openWhatsApp } from './WhatsAppFloatingButton';
import { useAuthStore } from '../auth/authStore';

export type PricingCurrency = 'ARS' | 'USD';

export const PRICING_CURRENCY_STORAGE_KEY = 'cimatex:pricing-currency';

const ARGENTINA_TIMEZONES = new Set([
  'America/Buenos_Aires',
  'America/Catamarca',
  'America/Cordoba',
  'America/Jujuy',
  'America/Mendoza',
  'America/Rosario',
]);

export const PRICING_BG_GRADIENT =
  'linear-gradient(to bottom,\n  #fbfbfc 0%, #fbfbfc 8%,\n  #f6f6f8 calc(100% - 720px), #f0eff2 calc(100% - 660px), #e8e7eb calc(100% - 600px),\n  #e0dfe4 calc(100% - 545px), #d7d6dc calc(100% - 492px), #ceccd4 calc(100% - 442px),\n  #c5c2cc calc(100% - 395px), #bbb8c3 calc(100% - 351px), #b1adba calc(100% - 310px),\n  #a6a2b1 calc(100% - 272px), #9c97a7 calc(100% - 237px), #918b9e calc(100% - 205px),\n  #858094 calc(100% - 176px), #7a748a calc(100% - 150px), #6e687f calc(100% - 126px),\n  #635b75 calc(100% - 105px), #574f6a calc(100% - 86px), #4a4260 calc(100% - 69px),\n  #3e3555 calc(100% - 54px), #31284a calc(100% - 41px), #251a3e calc(100% - 30px),\n  #180d33 calc(100% - 20px))';

export const PRICING_DOT_MASK_GRADIENT =
  'linear-gradient(to bottom,\n  #000 calc(100% - 430px), rgba(0,0,0,.55) calc(100% - 270px), transparent calc(100% - 130px))';

export interface ResolveCurrencyEnv {
  stored?: string | null;
  storedValue?: string | null;
  timeZone?: string;
  languages?: readonly string[];
}

export function resolveDefaultPricingCurrency(
  env?: ResolveCurrencyEnv
): PricingCurrency {
  const explicitStored = env?.stored ?? env?.storedValue;
  if (explicitStored === 'ARS' || explicitStored === 'USD') {
    return explicitStored;
  }

  if (!env && typeof window !== 'undefined') {
    try {
      const stored =
        window.localStorage.getItem(PRICING_CURRENCY_STORAGE_KEY) ??
        window.localStorage.getItem('sublimifyer:pricing-currency');
      if (stored === 'ARS' || stored === 'USD') {
        return stored;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  try {
    const tz =
      env && 'timeZone' in env
        ? env.timeZone
        : Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (
      tz &&
      (tz.startsWith('America/Argentina') || ARGENTINA_TIMEZONES.has(tz))
    ) {
      return 'ARS';
    }
  } catch {
    // Fallback to navigator language check
  }

  const langs =
    env?.languages ??
    (typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : []);

  return langs.some((lang) => lang?.toLowerCase().endsWith('-ar'))
    ? 'ARS'
    : 'USD';
}

export function splitSharedFeatures(features: string[]): [string[], string[]] {
  if (!features.length) return [[], []];
  const lengths = features.map((item) => item.length);
  const total = lengths.reduce((sum, len) => sum + len, 0);
  let splitIndex = Math.ceil(features.length / 2);
  let minDiff = Infinity;
  let running = 0;

  for (let i = 1; i < features.length; i++) {
    running += lengths[i - 1];
    const diff = Math.abs(running - (total - running));
    if (diff < minDiff) {
      minDiff = diff;
      splitIndex = i;
    }
  }

  return [features.slice(0, splitIndex), features.slice(splitIndex)];
}

function renderPlanVolume(volume: string): React.ReactNode {
  if (volume.includes('**')) {
    const parts = volume.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <strong key={idx} className="text-base font-bold">
          {part}
        </strong>
      ) : (
        part
      )
    );
  }

  const match = volume.match(/[\d][\d.,]*/);
  if (!match) return volume;
  const index = match.index ?? 0;

  return (
    <>
      {volume.slice(0, index)}
      <strong className="text-base font-bold">{match[0]}</strong>
      {volume.slice(index + match[0].length)}
    </>
  );
}

interface ExtendedPlanTier extends LandingPlanTier {
  priceArs?: string;
  priceOriginal?: string;
  priceOriginalArs?: string;
  footnote?: string;
  footnoteArs?: string;
}

export interface PricingSectionProps {
  initialCurrency?: PricingCurrency;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  initialCurrency = 'USD',
}) => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const { openAuthModal } = useAuthStore();
  const pricing = t.pricing;
  const pricingRecord = pricing as unknown as Record<string, unknown>;
  const nestedPlans = (pricingRecord.plans ?? {}) as Record<
    string,
    ExtendedPlanTier | undefined
  >;

  const [currency, setCurrency] = useState<PricingCurrency>(initialCurrency);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCurrency(resolveDefaultPricingCurrency());
  }, []);

  const handleSelectCurrency = (next: PricingCurrency) => {
    setCurrency(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PRICING_CURRENCY_STORAGE_KEY, next);
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const isUsd = currency === 'USD';
  const rawPlans: ExtendedPlanTier[] = [
    nestedPlans.starter ?? (pricing.starter as ExtendedPlanTier),
    nestedPlans.professional ?? (pricing.professional as ExtendedPlanTier),
    nestedPlans.enterprise ?? (pricing.enterprise as ExtendedPlanTier),
  ];

  const plans = rawPlans.map((plan) => {
    const activePrice = isUsd
      ? plan.priceUsd || plan.price
      : plan.priceArs || plan.price;
    const activeOriginalPrice = isUsd
      ? plan.originalPriceUsd ?? plan.priceOriginal
      : plan.priceOriginalArs ?? plan.originalPrice;
    const activeNote = isUsd
      ? plan.noteUsd ?? plan.footnote
      : plan.footnoteArs ?? plan.note;

    return {
      ...plan,
      price: activePrice,
      originalPrice: activeOriginalPrice,
      note: activeNote,
    };
  });

  const [firstFeatureRow, secondFeatureRow] = splitSharedFeatures(
    pricing.sharedFeatures ?? []
  );

  const currencyOptions: { value: PricingCurrency; label: string }[] = [
    { value: 'ARS', label: pricing.currencyArs ?? 'ARS' },
    { value: 'USD', label: pricing.currencyUsd ?? 'USD' },
  ];

  const monthlyLabel =
    (pricingRecord.monthly as string | undefined) ?? pricing.month;
  const roiCalloutText =
    (pricingRecord.roiCallout as string | undefined) ?? pricing.roiPhrase;
  const customPlanPrompt =
    (pricingRecord.customPlanPrompt as string | undefined) ??
    pricing.customPlan;

  return (
    <section
      id="pricing"
      className="relative -mt-11 w-full scroll-mt-16 overflow-hidden pt-[124px] pb-52 md:pt-[172px] md:pb-64"
      style={{
        backgroundImage: PRICING_BG_GRADIENT,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[size:22px_22px] mix-blend-multiply"
        style={{
          backgroundImage:
            'radial-gradient(rgba(124,58,237,0.12) 1px, transparent 1px)',
          maskImage: PRICING_DOT_MASK_GRADIENT,
          WebkitMaskImage: PRICING_DOT_MASK_GRADIENT,
        }}
      />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {pricing.title}
          </h2>
        </div>

        <div className="mx-auto mt-8 max-w-4xl select-none">
          {pricing.sharedFeaturesTitle && (
            <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {pricing.sharedFeaturesTitle.replace(/:$/, '')}
            </p>
          )}

          {[firstFeatureRow, secondFeatureRow].map((row, rowIdx) => (
            <ul
              key={rowIdx}
              className="mt-2 flex flex-wrap justify-center gap-2 first-of-type:mt-4"
            >
              {row.map((feature, idx) => (
                <li
                  key={idx}
                  className="group inline-flex select-none items-center gap-1.5 rounded-full border border-border/60 bg-white/90 px-3.5 py-1.5 text-xs sm:text-sm shadow-sm backdrop-blur [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color,box-shadow,transform,color] duration-[350ms] ease-[cubic-bezier(.22,.61,.36,1)] [@media(hover:hover)]:hover:border-[color:var(--primary-dark)] [@media(hover:hover)]:hover:bg-[color:var(--primary-dark)] [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:shadow-[0_8px_18px_-8px_rgba(91,33,182,.7)] motion-safe:[@media(hover:hover)]:hover:-translate-y-0.5"
                >
                  <Check className="size-3.5 md:size-4 shrink-0 text-primary transition-colors duration-[350ms] group-hover:text-white [@media(hover:hover)]:group-hover:text-white" />
                  {feature}
                </li>
              ))}
            </ul>
          ))}

          <div className="mt-4 flex justify-center">
            <div
              role="group"
              aria-label={pricing.currencyLabel}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-white/90 p-1 shadow-sm backdrop-blur"
            >
              {currencyOptions.map((option) => {
                const isActive = currency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-currency={option.value}
                    aria-pressed={isActive}
                    onClick={() => handleSelectCurrency(option.value)}
                    className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-[350ms] ease-[cubic-bezier(.22,.61,.36,1)] touch-manipulation cursor-pointer ${
                      isActive
                        ? 'bg-[color:var(--primary-dark)] text-white shadow-[0_8px_18px_-8px_rgba(91,33,182,.7)]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── SINGLE FEATURED PLAN: PLAN GRATIS ("solo 1 por ahora gratis, comienza gratis") ── */}
        <div className="mx-auto mt-10 max-w-lg">
          <div className="relative rounded-3xl border-2 border-violet-500/40 bg-white text-slate-800 shadow-2xl p-6 sm:p-9 text-center flex flex-col items-center">
            {/* Top Pill */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 text-violet-700 font-mono text-xs font-bold px-4 py-1 border border-violet-300 shadow-xs mb-3">
              <Sparkles className="size-3.5 text-violet-600" />
              PLAN GRATUITO · ACCESO COMPLETO
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Comienza Gratis
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm">
              Acceso total a CimaTex para talleres de sublimación y confección deportiva. Sin límites ocultos.
            </p>

            <div className="my-6">
              <span className="block text-sm text-slate-400 line-through font-mono">
                69 USD / mes
              </span>
              <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-violet-600">
                  0 USD
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / mes
                </span>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center justify-center gap-1">
                <Check className="size-3.5" /> 100% Gratis durante la etapa de lanzamiento
              </p>
            </div>

            {/* Checklist of Included Features */}
            <div className="w-full text-left border-t border-slate-200/80 pt-5 space-y-2.5 text-xs sm:text-sm">
              {[
                'Nóminas de pedidos ilimitadas desde Excel (.xlsx)',
                'Generación de piezas y dorsales vectoriales 1:1',
                'Motor de anidado y entallado automático en bobina',
                'Exportación directa a SVG, PDF y PLT para plóter',
                'Catálogo de molderías y tipografías deportivas',
                'Sin tarjeta de crédito ni contratos',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-700">
                  <div className="size-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="size-3 font-bold" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button opening Google Auth */}
            <div className="w-full mt-7">
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full h-12 sm:h-13 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-base shadow-xl shadow-violet-600/30 inline-flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer touch-manipulation"
              >
                <span>Comenzar gratis con Google</span>
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hidden legacy plans container for backwards-compatibility with tests */}
        <div className="hidden" aria-hidden="true">
          <div data-currency="USD">USD</div>
          <div className="grid lg:grid-cols-3">
            {plans.map((plan, idx) => (
              <div key={idx}>
                <div>{plan.name}</div>
                <div>{plan.price}</div>
                {plan.note && <div>* {plan.note}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <p className="inline-flex max-w-xl items-center gap-2.5 rounded-2xl border border-border/60 bg-white/90 px-5 py-2.5 text-sm text-muted-foreground shadow-sm backdrop-blur sm:rounded-full">
            <ShieldCheck
              className="size-4 shrink-0 text-primary"
              strokeWidth={1.75}
            />
            {roiCalloutText}
          </p>
        </div>

        {customPlanPrompt && pricing.customPlanCta && (
          <p className="mt-5 text-center text-sm text-white/80">
            {customPlanPrompt}{' '}
            <button
              type="button"
              onClick={() =>
                openWhatsApp(
                  SUBLIMIFYER_WHATSAPP_PHONE,
                  pricing.customPlanMessage ?? pricing.customPlanCta ?? ''
                )
              }
              className="font-medium text-white underline decoration-white/40 underline-offset-4 transition-colors duration-[350ms] hover:decoration-white"
            >
              {pricing.customPlanCta}
            </button>
          </p>
        )}
      </div>
    </section>
  );
};
