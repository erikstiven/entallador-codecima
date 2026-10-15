import React, { useMemo, useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Layers,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';

export const RECOVERY_RATE = 0.135; // 13.5% promedio de tela/papel recuperado

export const SavingsCalculatorSection: React.FC = () => {
  const { openAuthModal } = useAuthStore();

  const [meters, setMeters] = useState<number>(1000);
  const [costPerMeter, setCostPerMeter] = useState<number>(2.8);

  // Cálculos reactivos
  const { recoveredMeters, monthlySavings, annualSavings } = useMemo(() => {
    // Metros recuperados al mes = metros * 13.5%
    const recMeters = Math.round(meters * RECOVERY_RATE);
    // Ahorro mensual = metros recuperados * costo aproximado por metro
    const monthSave = Math.round(recMeters * costPerMeter);
    // Ahorro anual = mensual * 12
    const yearSave = monthSave * 12;

    return {
      recoveredMeters: recMeters,
      monthlySavings: monthSave,
      annualSavings: yearSave,
    };
  }, [meters, costPerMeter]);

  // Porcentaje para el relleno de la barra del slider
  const metersPercent = ((meters - 100) / (5000 - 100)) * 100;
  const costPercent = ((costPerMeter - 1.0) / (6.0 - 1.0)) * 100;

  return (
    <section
      id="calculadora"
      data-testid="landing-savings-calculator"
      className="relative w-full py-20 md:py-32 bg-[#180d33] text-white overflow-hidden scroll-mt-16"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.25) 0%, transparent 60%), radial-gradient(#351d66 1px, transparent 1px)',
        backgroundSize: '100% 100%, 22px 22px',
      }}
    >
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/30 mb-4">
            <Calculator className="size-3.5 text-[#a78bfa]" />
            <span>Retorno de Inversión Inmediato</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Calculadora de Ahorro para tu Taller
          </h2>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            Comprueba cuánto dinero y metros de tela estás dejando en la mesa cada mes
            por acomodar a mano en Corel o Illustrator.
          </p>
        </div>

        {/* Sliders Container: Full-width modern glass card */}
        <div className="mt-12 max-w-5xl mx-auto rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-md p-5 sm:p-8 md:p-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Slider 1: Metros impresos al mes */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-[#a78bfa]" />
                  <label
                    htmlFor="slider-meters"
                    className="text-sm font-semibold text-white/90"
                  >
                    Metros impresos al mes
                  </label>
                </div>
                <span className="text-base sm:text-lg font-bold text-[#a78bfa] bg-[#a78bfa]/15 px-3 py-0.5 rounded-full border border-[#a78bfa]/30 tabular-nums">
                  {meters.toLocaleString('es-ES')} m
                </span>
              </div>

              <input
                id="slider-meters"
                data-testid="slider-meters"
                type="range"
                min={100}
                max={5000}
                step={50}
                value={meters}
                onChange={(e) => setMeters(Number(e.target.value))}
                className="w-full h-3 sm:h-2.5 rounded-lg appearance-none cursor-pointer accent-[#a78bfa] transition-all touch-manipulation [touch-action:manipulation] py-2"
                style={{
                  background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${metersPercent}%, rgba(255, 255, 255, 0.2) ${metersPercent}%, rgba(255, 255, 255, 0.2) 100%)`,
                }}
              />

              <div className="flex justify-between items-center text-xs text-white/50 mt-2 font-mono">
                <span>100 m</span>
                <span>2.500 m</span>
                <span>5.000 m</span>
              </div>

              {/* Presets */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[500, 1000, 2500, 4000].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => setMeters(presetVal)}
                    className={`text-xs px-3 py-1.5 min-h-[36px] rounded-lg transition-all border touch-manipulation active:scale-95 ${
                      meters === presetVal
                        ? 'bg-[#a78bfa] text-[#180d33] border-[#a78bfa] font-semibold shadow-xs'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {presetVal.toLocaleString('es-ES')} m
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Costo por metro de tela + papel */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-[#a78bfa]" />
                  <label
                    htmlFor="slider-cost"
                    className="text-sm font-semibold text-white/90"
                  >
                    Costo aprox. por metro de tela + papel
                  </label>
                </div>
                <span className="text-base sm:text-lg font-bold text-[#a78bfa] bg-[#a78bfa]/15 px-3 py-0.5 rounded-full border border-[#a78bfa]/30 tabular-nums">
                  ${costPerMeter.toFixed(2)} USD
                </span>
              </div>

              <input
                id="slider-cost"
                data-testid="slider-cost"
                type="range"
                min={1.0}
                max={6.0}
                step={0.1}
                value={costPerMeter}
                onChange={(e) => setCostPerMeter(Number(e.target.value))}
                className="w-full h-3 sm:h-2.5 rounded-lg appearance-none cursor-pointer accent-[#a78bfa] transition-all touch-manipulation [touch-action:manipulation] py-2"
                style={{
                  background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${costPercent}%, rgba(255, 255, 255, 0.2) ${costPercent}%, rgba(255, 255, 255, 0.2) 100%)`,
                }}
              />

              <div className="flex justify-between items-center text-xs text-white/50 mt-2 font-mono">
                <span>$1.00 USD</span>
                <span>$3.50 USD</span>
                <span>$6.00 USD</span>
              </div>

              {/* Presets */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[1.8, 2.8, 3.5, 4.5].map((presetCost) => (
                  <button
                    key={presetCost}
                    type="button"
                    onClick={() => setCostPerMeter(presetCost)}
                    className={`text-xs px-3 py-1.5 min-h-[36px] rounded-lg transition-all border touch-manipulation active:scale-95 ${
                      Math.abs(costPerMeter - presetCost) < 0.05
                        ? 'bg-[#a78bfa] text-[#180d33] border-[#a78bfa] font-semibold shadow-xs'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    ${presetCost.toFixed(2)} USD
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-white/60 leading-relaxed border-t border-white/10 pt-4 mt-6">
            * Estimación basada en la tasa promedio de <strong>~13.5%</strong> de tela recuperada
            por algoritmos de anidado automático continuo frente a la merma típica manual en talleres textiles.
          </p>
        </div>

        {/* 3 Result Cards: Responsive Grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) */}
        <div className="mt-8 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {/* Card 1: Aprovechamiento */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-md p-6 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs uppercase tracking-wider text-white/60 font-semibold block">
                Aprovechamiento
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                  ~13.5%
                </span>
                <span className="text-xs text-white/50">recuperado por rollo</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-xs uppercase tracking-wider text-white/60 font-semibold block">
                Metros recuperados
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  data-testid="stat-recovered-meters"
                  className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums"
                >
                  {recoveredMeters.toLocaleString('es-ES')} m
                </span>
              </div>
              <span className="text-[11px] text-white/50 mt-0.5 block">
                ahorrados cada mes
              </span>
            </div>
          </div>

          {/* Card 2: Ahorro Mensual */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-6 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#a78bfa] font-semibold block">
                Ahorro mensual en USD
              </span>
              <span className="text-xs text-white/60 mt-1 block">Directo a tu utilidad neta</span>
            </div>

            <div className="my-auto py-4">
              <span
                data-testid="stat-monthly-savings"
                className="text-3xl sm:text-4xl lg:text-4xl font-extrabold text-white tabular-nums block"
              >
                ~${monthlySavings.toLocaleString('en-US')}{' '}
                <span className="text-sm font-semibold text-white/60">USD / mes</span>
              </span>
            </div>

            <div className="text-[11px] text-emerald-400 font-medium">
              ✓ Ingreso recuperado mes a mes
            </div>
          </div>

          {/* Card 3: Ahorro Anual */}
          <div className="sm:col-span-2 lg:col-span-1 relative rounded-3xl border-2 border-[#a78bfa] bg-gradient-to-br from-[#a78bfa]/25 via-[#180d33] to-[#351d66] p-6 text-center overflow-hidden shadow-[0_20px_50px_rgba(167,139,250,0.28)] flex flex-col justify-between">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#a78bfa]/20 blur-2xl"
            />

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#a78bfa]/30 text-[#a78bfa] mb-2">
                <TrendingUp className="size-3.5" />
                <span>Proyección de impacto anual</span>
              </div>
              <div className="text-xs sm:text-sm text-white/80 mt-0.5">
                Ahorro anual estimado para tu taller
              </div>
            </div>

            <div className="my-3">
              <div
                data-testid="stat-annual-savings"
                className="text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums drop-shadow-md"
              >
                ~${annualSavings.toLocaleString('en-US')}{' '}
                <span className="text-xl sm:text-2xl font-bold text-[#a78bfa]">USD / año</span>
              </div>
            </div>

            <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
              Equivale a bobinas extra, mantenimiento o más capacidad para tu equipo.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-8 max-w-xl mx-auto text-center">
          <button
            type="button"
            data-testid="btn-savings-register"
            onClick={openAuthModal}
            className="w-full py-4 px-6 rounded-full font-bold text-base sm:text-lg bg-white text-[#180d33] hover:bg-white/95 shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-3 cursor-pointer group touch-manipulation"
          >
            {/* Official Google 4-Color Icon */}
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Comenzar a ahorrar gratis con Google</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/60">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Sin tarjeta de crédito • Acceso instantáneo en la nube • Plan gratuito</span>
          </div>
        </div>
      </div>
    </section>
  );
};
