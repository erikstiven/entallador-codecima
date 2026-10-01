import React from 'react';
import { 
  FileSpreadsheet, 
  Palette, 
  Scissors, 
  LayoutGrid, 
  Clock, 
  Settings, 
  Sparkles,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { useNavigationStore, AppView } from '@/modules/navigation/navigationStore';
import { useSystemSettingsStore } from '@/modules/settings/systemSettingsStore';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stepNumber: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'NEW_ORDER', label: 'Nuevo Pedido', icon: FileSpreadsheet, description: 'Importar Excel y Jugadores', stepNumber: '01' },
  { id: 'DESIGNS', label: 'Diseños Maestros', icon: Palette, description: 'Artes Illustrator y Tipografías', stepNumber: '02' },
  { id: 'PATTERNS', label: 'Moldes Vectoriales', icon: Scissors, description: 'Patrones y Curvas 1:1 por Talla', stepNumber: '03' },
  { id: 'NESTING', label: 'Entallado / Nesting', icon: LayoutGrid, description: 'Acomodo en Rollo 1120 mm', stepNumber: '04' },
  { id: 'HISTORY', label: 'Historial & Reposición', icon: Clock, description: 'Pedidos y Reimpresiones', stepNumber: '05' },
  { id: 'SETTINGS', label: 'Configuración', icon: Settings, description: 'Empresa, Bobinas y Tolerancias', stepNumber: '06' },
];

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useNavigationStore();
  const { settings } = useSystemSettingsStore();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-base tracking-tighter shadow-lg shadow-emerald-950/60 ring-1 ring-white/20">
              CDC
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide text-white flex items-center gap-1.5">
                CODECIMA
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">SubliFit & Nesting 1:1</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Flujo de Producción
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 font-semibold ring-1 ring-emerald-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-900'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="leading-tight">{item.label}</div>
                    <div className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${
                    isActive ? 'bg-black/20 text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {item.stepNumber}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Workshop System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Motor Clipper2 WASM
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
              1:1 mm
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Calibrado para RasterLink & Plotters Epson
          </p>
        </div>
      </div>
    </aside>
  );
};
