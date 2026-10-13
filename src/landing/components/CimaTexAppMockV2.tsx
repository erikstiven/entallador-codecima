import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Palette,
  Scissors,
  LayoutGrid,
  Clock,
  Settings,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';

interface ModuleItem {
  id: string;
  step: string;
  title: string;
  category: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  metrics: string;
  accent: string;
}

const MODULES_LIST: ModuleItem[] = [
  {
    id: 'roster',
    step: '01',
    title: 'Nuevo Pedido y Nómina',
    category: 'Ingreso & Validación',
    badge: 'Excel / CSV Inteligente',
    desc: 'Carga masiva de planillas de clubes y escuelas deportivas. Asignación inmediata de nombres, números dorsales y curva de talles sin errores tipográficos.',
    icon: FileSpreadsheet,
    features: [
      'Importación directa de Excel (.xlsx y .csv)',
      'Asignación automática de tallas (S, M, L, XL, XXL)',
      'Validación de caracteres especiales y acentos',
    ],
    metrics: 'Carga de 100+ jugadores en < 2 seg',
    accent: 'emerald',
  },
  {
    id: 'designer',
    step: '02',
    title: 'Diseñador Maestro 1:1',
    category: 'Composición Vectorial',
    badge: 'Escala Milimétrica Real',
    desc: 'Inspección milimétrica de cada prenda sobre el molde real. Calibra dorsales, patrocinadores y escudos asegurando que no caigan en costuras ni sisas.',
    icon: Palette,
    features: [
      'Lienzo vectorial a escala 1:1 milimétrica',
      'Líneas de costura y sangría de corte visibles',
      'Textos vectorizados listos para rip de impresión',
    ],
    metrics: '0% deformación de logos en costura',
    accent: 'violet',
  },
  {
    id: 'patterns',
    step: '03',
    title: 'Moldes y Curvas de Talla',
    category: 'Patronaje Industrial',
    badge: 'Graduación SVG / DXF',
    desc: 'Gestión de curvas de patronaje base para camisetas, shorts, mangas y cuellos. Escalado anatómico proporcional que respeta caídas y proporciones.',
    icon: Scissors,
    features: [
      'Compatibilidad con moldes SVG vectoriales',
      'Graduación proporcional automatizada por talle',
      'Separación limpia de piezas delanteras, espaldas y mangas',
    ],
    metrics: 'Curvas de patronaje estandarizadas',
    accent: 'fuchsia',
  },
  {
    id: 'nesting',
    step: '04',
    title: 'Entallador y Bobina Continua',
    category: 'Optimización de Espacio',
    badge: 'Ahorro > 90% en Rollo',
    desc: 'Algoritmo de anidamiento inteligente (nesting poligonal) que acomoda todas las piezas del pedido en rollos continuos reduciendo el desperdicio al mínimo.',
    icon: LayoutGrid,
    features: [
      'Configuración de anchos: 1.10 m, 1.40 m, 1.60 m y más',
      'Rotaciones optimizadas respetando el hilo de tela',
      'Cálculo exacto de metros lineales y porcentaje de desperdicio',
    ],
    metrics: 'Eficiencia promedio comprobada: 91.8%',
    accent: 'indigo',
  },
  {
    id: 'history',
    step: '05',
    title: 'Historial y Reimpresiones',
    category: 'Trazabilidad de Taller',
    badge: 'Control por Lote',
    desc: 'Auditoría permanente de órdenes procesadas. Si una prenda sufre una rotura durante confección, reimprime la pieza individual en un clic sin rehacer el rollo.',
    icon: Clock,
    features: [
      'Reimpresión de pieza unitaria (ej. manga dañada)',
      'Histórico de pedidos en base de datos local y segura',
      'Registro de consumo de tela por cliente y fecha',
    ],
    metrics: 'Reimpresión puntual sin costo extra',
    accent: 'amber',
  },
  {
    id: 'settings',
    step: '06',
    title: 'Configuración de Taller & Plóter',
    category: 'Parámetros del Taller',
    badge: 'Calibración Térmica',
    desc: 'Ajusta tu flujo de trabajo al plóter y calandra de tu taller. Configura sangrías de corte, marcas de piquete y compensación por encogimiento térmico.',
    icon: Settings,
    features: [
      'Presets para Epson SureColor, Roland y Mimaki',
      'Compensación porcentual de encogimiento por calandra',
      'Exportación en SVG, PDF vectorial y EPS para RIP',
    ],
    metrics: 'Ajuste exacto al milímetro de tu máquina',
    accent: 'blue',
  },
];

export const CimaTexAppMockV2: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('designer');
  const { openAuthModal } = useAuthStore();

  const selectedModule =
    MODULES_LIST.find((m) => m.id === selectedModuleId) || MODULES_LIST[0];

  return (
    <div className="w-full bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-hidden rounded-b-xl border border-t-0 border-slate-200 shadow-sm">
      {/* ── TOP BROWSER APP BAR (FONDO CLARO) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-5 py-2.5 text-xs">
        {/* URL / System status badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-slate-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold text-slate-800">
              cimatex.codecima.com/app
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500">
            · Suite de Producción Textil
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
            6 Módulos Disponibles
          </span>
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="size-3.5 text-violet-200" />
            <span>Comenzar gratis con Google</span>
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-[520px] overflow-hidden">
        {/* ── LEFT APP SIDEBAR (FONDO CLARO SAAS) ── */}
        <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between p-3.5 sm:p-4">
          <div>
            {/* Brand Identity Header */}
            <div className="flex items-center gap-2.5 px-2.5 py-2 mb-3 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src="/cimatex-icon.png"
                alt="CimaTex"
                width={30}
                height={30}
                className="size-7.5 object-contain"
              />
              <div className="min-w-0">
                <div className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1">
                  <span>Cima</span>
                  <span className="text-violet-600">Tex</span>
                  <span className="text-[9px] font-mono font-bold text-violet-700 bg-violet-100 px-1 py-0.5 rounded border border-violet-200">
                    v2.4
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 truncate">
                  Entallador & Patronaje
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              Módulos del Sistema
            </div>
            <nav className="space-y-1">
              {MODULES_LIST.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedModuleId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedModuleId(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`size-4 shrink-0 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="leading-tight truncate font-medium">
                          {item.title}
                        </div>
                        <div
                          className={`text-[9px] truncate ${
                            isSelected ? 'text-violet-100' : 'text-slate-400'
                          }`}
                        >
                          {item.category}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? 'bg-black/20 text-white font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.step}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Details */}
          <div className="mt-4 pt-3 border-t border-slate-100 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[10px] font-mono text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Ancho Bobina:</span>
              <span className="text-slate-900 font-bold">1600 mm</span>
            </div>
            <div className="flex justify-between">
              <span>Sangría de corte:</span>
              <span className="text-slate-900 font-bold">3 mm</span>
            </div>
            <div className="flex justify-between">
              <span>Plóter Epson:</span>
              <span className="text-violet-700 font-semibold truncate">
                SureColor F9470
              </span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN MODULES SHOWCASE (SOLO MÓDULOS) ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/70 p-4 sm:p-6 overflow-y-auto">
          {/* Section Header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-md">
                  Panel de Módulos
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Arquitectura Modular CimaTex
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                Flujo Productivo Integrado de Punta a Punta
              </h3>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Acceder a los 6 Módulos</span>
              <ArrowRight className="size-3.5 text-slate-500" />
            </button>
          </div>

          {/* Grid of the 6 System Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {MODULES_LIST.map((mod) => {
              const Icon = mod.icon;
              const isSelected = selectedModuleId === mod.id;
              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`group relative rounded-2xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-white border-violet-500 shadow-md ring-2 ring-violet-500/20'
                      : 'bg-white/90 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top row: Step & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-violet-50 group-hover:text-violet-700'
                          }`}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <div>
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            Paso {mod.step}
                          </span>
                          <div className="text-[11px] font-semibold text-slate-500 leading-none">
                            {mod.category}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        {mod.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-violet-700 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3.5">
                      {mod.desc}
                    </p>

                    {/* Features checklist */}
                    <ul className="space-y-1.5 mb-4">
                      {mod.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-[11px] text-slate-600"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer metric & interactive action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono font-medium text-slate-500">
                      {mod.metrics}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAuthModal();
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-[11px] text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                    >
                      <span>Abrir</span>
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info Strip at bottom */}
          <div className="mt-5 rounded-xl bg-violet-50/70 border border-violet-100 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-violet-900">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-violet-600 shrink-0" />
              <span>
                <strong>Modo Demo Activo:</strong> Los 6 módulos están listos para tu taller con moldería deportiva y exportación en alta fidelidad.
              </span>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Comenzar gratis
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
