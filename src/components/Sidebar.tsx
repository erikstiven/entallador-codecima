import React from 'react';
import { 
  FileSpreadsheet, 
  Palette, 
  Scissors, 
  LayoutGrid, 
  Clock, 
  Settings, 
  Sparkles 
} from 'lucide-react';
import { useNavigationStore, AppView } from '@/modules/navigation/navigationStore';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'NEW_ORDER', label: 'Nuevo Pedido', icon: FileSpreadsheet, description: 'Importar Excel y Jugadores' },
  { id: 'DESIGNS', label: 'Diseños', icon: Palette, description: 'Biblioteca de Diseños Maestros' },
  { id: 'PATTERNS', label: 'Moldes', icon: Scissors, description: 'Moldes Vectoriales por Talla' },
  { id: 'NESTING', label: 'Entallado / Nesting', icon: LayoutGrid, description: 'Acomodo Automático 2D' },
  { id: 'HISTORY', label: 'Historial', icon: Clock, description: 'Pedidos y Proyectos Anteriores' },
  { id: 'SETTINGS', label: 'Configuración', icon: Settings, description: 'Perfiles de Bobina y Máquinas' },
];

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useNavigationStore();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/40">
            HMB
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
              ENTALLADOR
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Sublimación Deportiva 1:1</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-medium ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div>
                  <div>{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Workshop System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Motor Geométrico
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">1:1 mm</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Calibrado RasterLink Epson</p>
        </div>
      </div>
    </aside>
  );
};
