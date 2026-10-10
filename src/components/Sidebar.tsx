import React from 'react';
import { 
  FileSpreadsheet, 
  Palette, 
  Scissors, 
  LayoutGrid, 
  Clock, 
  Settings,
} from 'lucide-react';
import { useNavigationStore, AppView } from '@/modules/navigation/navigationStore';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stepNumber: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'NEW_ORDER', label: 'Nuevo Pedido', icon: FileSpreadsheet, description: 'Nómina y tallas', stepNumber: '01' },
  { id: 'DESIGNS', label: 'Diseños Maestros', icon: Palette, description: 'Artes y fuentes', stepNumber: '02' },
  { id: 'PATTERNS', label: 'Moldes Vectoriales', icon: Scissors, description: 'Patrones 1:1', stepNumber: '03' },
  { id: 'NESTING', label: 'Entallado / Nesting', icon: LayoutGrid, description: 'Acomodo en bobina', stepNumber: '04' },
  { id: 'HISTORY', label: 'Historial', icon: Clock, description: 'Pedidos y reposición', stepNumber: '05' },
  { id: 'SETTINGS', label: 'Configuración', icon: Settings, description: 'Ajustes del sistema', stepNumber: '06' },
];

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useNavigationStore();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen flex-shrink-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/60 p-1.5 flex items-center justify-center overflow-hidden shadow-md shadow-purple-950/30">
              <img 
                src="/cimapattern-icon.png" 
                alt="CimaPattern" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide text-white">
                CimaPattern
              </h1>
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
                    ? 'bg-violet-600 text-white shadow-lg shadow-purple-950/60 font-semibold ring-1 ring-violet-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400 group-hover:text-purple-400 group-hover:bg-slate-900'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="leading-tight">{item.label}</div>
                    <div className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-violet-100' : 'text-slate-400'}`}>
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

      {/* Clean Minimal Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 font-mono">
          <span>v2.5 Sublimación</span>
          <span className="text-purple-400 font-semibold">1:1 mm</span>
        </div>
      </div>
    </aside>
  );
};
