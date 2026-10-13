import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { LandingPlanTier } from '../i18n/es';
import { useAppRoute } from '../router/landingRouteStore';
import { SUBLIMIFYER_WHATSAPP_PHONE } from '../data/subpagesData';
import { openWhatsApp } from './WhatsAppFloatingButton';

export type PricingCurrency = 'ARS' | 'USD';

export const PRICING_CURRENCY_STORAGE_KEY = 'sublimifyer:pricing-currency';

const ARGENTINA_TIMEZONES = new Set([
  'America/Buenos_Aires',
  'America/Catamarca',
  'America/Cordoba',
  'America/Jujuy',
  'America/Mendoza',
  'America/Rosario',
]);

export const PRICING_BG_GRADIENT =
  'linear-gradient(to bottom,\n  #fbfbfc 0%, #fbfbfc 8%,\n  #f7faf9 calc(100% - 720px), #f0f6f5 calc(100% - 660px), #e6efed calc(100% - 600px),\n  #dae7e4 calc(100% - 545px), #ccdedb calc(100% - 492px), #bcd3cf calc(100% - 442px),\n  #abc7c2 calc(100% - 395px), #99bab5 calc(100% - 351px), #87ada8 calc(100% - 310px),\n  #75a09b calc(100% - 272px), #64938e calc(100% - 237px), #548781 calc(100% - 205px),\n  #457a75 calc(100% - 176px), #376e69 calc(100% - 150px), #2b635e calc(100% - 126px),\n  #215a55 calc(100% - 105px), #18524d calc(100% - 86px), #114b47 calc(100% - 69px),\n  #0c4744 calc(100% - 54px), #094441 calc(100% - 41px), #07433f calc(100% - 30px),\n  #06423e calc(100% - 20px))';

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
      const stored = window.localStorage.getItem(PRICING_CURRENCY_STORAGE_KEY);
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
  initialCurrency = 'ARS',
}) => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
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
            'radial-gradient(rgba(6,66,62,0.13) 1px, transparent 1px)',
          maskImage: PRICING_DOT_MASK_GRADIENT,
          WebkitMaskImage: PRICING_DOT_MASK_GRADIENT,
        }}
      />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
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
                  className="group inline-flex select-none items-center gap-1.5 rounded-full border border-border/60 bg-white/90 px-3.5 py-1.5 text-sm shadow-sm backdrop-blur [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color,box-shadow,transform,color] duration-[350ms] ease-[cubic-bezier(.22,.61,.36,1)] [@media(hover:hover)]:hover:border-[color:var(--primary-dark)] [@media(hover:hover)]:hover:bg-[color:var(--primary-dark)] [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:shadow-[0_8px_18px_-8px_rgba(0,101,93,.7)] motion-safe:[@media(hover:hover)]:hover:-translate-y-0.5"
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
                    className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-[350ms] ease-[cubic-bezier(.22,.61,.36,1)] ${
                      isActive
                        ? 'bg-[color:var(--primary-dark)] text-white shadow-[0_8px_18px_-8px_rgba(0,101,93,.7)]'
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

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, idx) => (
            <div key={idx}>
              <div className="relative h-full rounded-2xl border border-border/60 bg-background text-card-foreground shadow-sm">
                <div className="flex h-full flex-col p-8">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  {plan.volume && (
                    <p className="mt-1 text-sm font-medium text-[color:var(--hero-accent)]">
                      {renderPlanVolume(plan.volume)}
                      {plan.note && (
                        <sup className="ml-0.5 font-normal">*</sup>
                      )}
                    </p>
                  )}

                  <div className="mt-8">
                    {plan.originalPrice && (
                      <span className="block text-sm text-muted-foreground line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                    <div className="mt-1 text-4xl font-bold tracking-tight">
                      {plan.price}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {monthlyLabel}
                    </p>
                  </div>

                  <div className="mt-auto pt-8">
                    <button
                      type="button"
                      onClick={() => navigateTo('/app')}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {plans.some((plan) => Boolean(plan.note)) && (
          <div className="mx-auto mt-2 grid max-w-5xl gap-6 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan, idx) => (
              <div key={idx}>
                {plan.note && (
                  <p className="flex justify-center px-1 text-xs text-foreground/70">
                    * {plan.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

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
