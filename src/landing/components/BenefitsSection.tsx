import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  FileCheck2,
  LayoutGrid,
  TrendingUp,
  WandSparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BENEFIT_ICONS = [
  { Icon: LayoutGrid, direction: 'down' as const },
  { Icon: FileCheck2, direction: 'down' as const },
  { Icon: WandSparkles, direction: 'down' as const },
  { Icon: TrendingUp, direction: 'up' as const },
];

export const BenefitsSection: React.FC = () => {
  const { t } = useLanguage();
  const benefits = t.benefits;

  if (!benefits?.items?.length) {
    return null;
  }

  return (
    <section
      id="beneficios"
      className="relative mx-4 scroll-mt-16 overflow-hidden rounded-[2rem] bg-[#180d33] bg-[radial-gradient(#351d66_1px,transparent_1px)] bg-[size:22px_22px] py-20 text-white shadow-[0_30px_60px_-34px_rgba(24,13,51,0.75)] md:mx-6 md:rounded-[2.5rem] md:py-32"
    >
      <div className="container relative px-4 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:self-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="block text-white">{benefits.titleLine1}</span>
              <span className="block text-[#a78bfa]">{benefits.titleLine2}</span>
            </h2>
            {benefits.subtitle && (
              <p className="mt-6 max-w-md text-base md:text-lg text-white/70">
                {benefits.subtitle}
              </p>
            )}
          </div>

          <ul className="relative">
            {benefits.items.map((item, idx) => {
              const { Icon, direction } =
                BENEFIT_ICONS[idx % BENEFIT_ICONS.length];
              const isUp = direction === 'up';

              return (
                <li
                  key={idx}
                  className="group flex gap-5 border-t border-white/15 py-7 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 ${
                      isUp
                        ? 'border-[#a78bfa] bg-[#a78bfa] text-[#180d33] shadow-[#a78bfa]/20'
                        : 'border-white/15 bg-white/5 text-[#a78bfa] group-hover:border-[#a78bfa]/50'
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <h3 className="text-base md:text-lg font-semibold tracking-tight text-white">
                        {item.title}
                      </h3>
                      {item.metric && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#a78bfa]/15 px-2.5 py-0.5 text-xs font-medium text-[#c4b5fd]">
                          {isUp ? (
                            <ArrowUp className="size-3" strokeWidth={2.5} />
                          ) : (
                            <ArrowDown className="size-3" strokeWidth={2.5} />
                          )}
                          {item.metric}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-white/65">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};
