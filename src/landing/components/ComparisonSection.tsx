import React from 'react';
import {
  Clock,
  TrendingDown,
  AlertTriangle,
  Flame,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  XCircle,
} from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  return (
    <section
      id="comparativa"
      data-testid="landing-comparison-section"
      className="relative w-full py-20 md:py-32 bg-white overflow-hidden scroll-mt-16 border-t border-slate-100"
    >
      {/* Decorative ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.06),transparent_70%)]"
      />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-violet-100 text-violet-800 mb-4">
            <Sparkles className="size-3.5 text-violet-600" />
            <span>El Dolor del Taller vs. La Solución Moderna</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Antes vs. Con CimaTex
          </h2>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            El dolor del confeccionista vs. la solución moderna: descubre cómo cambia tu taller
            cuando dejas atrás el acomodo manual y pasas a la producción automatizada 1:1.
          </p>
        </div>

        {/* 2 Contrasting Cards: Stacked on mobile, 2 columns on tablet/desktop */}
        <div className="mt-12 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto items-stretch">
          {/* Card 1: El método tradicional */}
          <div
            data-testid="traditional-method-card"
            className="relative flex flex-col rounded-3xl border border-rose-200/90 bg-gradient-to-b from-rose-50/50 via-white to-white p-5 sm:p-8 md:p-10 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="size-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="size-6" />
              </div>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                El método tradicional
              </span>
            </div>

            <div className="mt-5">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                El método tradicional (Manual en Corel / Illustrator)
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Acomodo manual pieza por pieza, desgaste mental del diseñador y pérdida constante de metros de bobina.
              </p>
            </div>

            <hr className="my-6 border-rose-100" />

            {/* Inefficiencies List */}
            <ul className="space-y-5 flex-1">
              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    3 horas acomodando a mano
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Girando y acomodando moldes manualmente con el mouse, bloqueando la computadora y demorando el inicio de la estampación.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingDown className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Mermas del 25-35%
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Grandes vacíos entre mangas, frentes y cuellos. Metros enteros de tela y papel que terminan en la basura.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Errores en dorsales y nombres
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Tipeo manual expuesto a faltas ortográficas, números duplicados o talles invertidos que obligan a reimprimir rollos enteros.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Estrés en fechas de entrega
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Turnos extendidos contra el reloj, plazos apretados con el cliente y tensión constante en el equipo de producción.
                  </p>
                </div>
              </li>
            </ul>

            {/* Bottom Pain Summary */}
            <div className="mt-8 rounded-2xl bg-rose-50/80 border border-rose-200/60 p-4 text-xs sm:text-sm text-rose-900 flex items-center gap-3">
              <span className="font-semibold shrink-0">Impacto real:</span>
              <span className="text-rose-800">
                Pérdida de cientos de dólares en merma mensual y clientes frustrados por retrasos.
              </span>
            </div>
          </div>

          {/* Card 2: Con CimaTex */}
          <div
            data-testid="cimatex-method-card"
            className="relative flex flex-col rounded-3xl border-2 border-[#7c3aed]/40 bg-gradient-to-b from-[#7c3aed]/[0.07] via-white to-white p-5 sm:p-8 md:p-10 shadow-xl shadow-[#7c3aed]/10 ring-1 ring-[#7c3aed]/20 transition-all duration-300 hover:shadow-2xl hover:shadow-[#7c3aed]/15"
          >
            {/* Recommended Pill */}
            <div className="absolute -top-3.5 right-4 sm:right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30">
              <Sparkles className="size-3" />
              <span>Recomendado para talleres</span>
            </div>

            {/* Card Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="size-12 rounded-2xl bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center shrink-0">
                <Zap className="size-6 text-[#7c3aed]" />
              </div>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#7c3aed]/15 text-[#7c3aed]">
                Automatizado 1:1
              </span>
            </div>

            <div className="mt-5">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                Con CimaTex (Automatizado 1:1)
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Anidado poligonal instantáneo, importación limpia desde planillas y archivos listos para el plóter.
              </p>
            </div>

            <hr className="my-6 border-[#7c3aed]/20" />

            {/* Advantages List */}
            <ul className="space-y-5 flex-1">
              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    10 segundos de cálculo automático
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Motor geométrico continuo que calcula el acomodo perfecto en segundos con un solo clic.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    &gt;90% de aprovechamiento en bobina
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Máxima densidad real sin solapamientos entre piezas. Menos metros de rollo consumidos por cada pedido.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Carga masiva desde Excel sin faltas ortográficas
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Sincronización directa de planillas de clubes y colegios con dorsales, nombres y talles automáticos.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3.5">
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Printer className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Exportación directa para RIP (Mimaki/Epson)
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Archivos vectoriales 1:1 en SVG, EPS y PDF con marcas de corte y sangrías calibradas para tu procesador.
                  </p>
                </div>
              </li>
            </ul>

            {/* Bottom Benefit Summary */}
            <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-xs sm:text-sm text-emerald-900 flex items-center gap-3">
              <span className="font-semibold shrink-0">Resultado garantizado:</span>
              <span className="text-emerald-800">
                Entregas a tiempo, cero reimpresiones por error y más rentabilidad neta por metro impreso.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
