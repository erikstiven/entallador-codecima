import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Palette, 
  Scissors, 
  LayoutGrid, 
  Clock, 
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
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

const STORAGE_COLLAPSED_KEY = 'cimatex_sidebar_collapsed';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useNavigationStore();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen flex-shrink-0 select-none z-20 transition-all duration-300 ease-in-out shadow-xs ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-3 border-b border-slate-100 flex items-center justify-between min-h-[58px]">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs flex-shrink-0">
              <img 
                src="/cimatex-icon.png" 
                alt="CimaTex" 
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                  <span>Cima</span>
                  <span className="text-violet-600">Tex</span>
                  <span className="text-[9px] font-mono font-bold text-violet-700 bg-violet-50 px-1 py-0.2 rounded border border-violet-200">
                    v2.5
                  </span>
                </h1>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  Entallador Textil
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Flujo de Producción
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
                className={`w-full flex items-center rounded-lg transition-all duration-150 text-xs font-medium cursor-pointer group ${
                  isCollapsed
                    ? 'justify-center p-2'
                    : 'justify-between px-2.5 py-2'
                } ${
                  isActive
                    ? 'bg-violet-50 text-violet-900 border border-violet-200/90 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                  <div className={`p-1 rounded-md transition-colors flex-shrink-0 ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:text-violet-600 group-hover:bg-violet-50'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {!isCollapsed && (
                    <div className="text-left min-w-0">
                      <div className="leading-tight truncate">{item.label}</div>
                      <div className={`text-[10px] font-normal truncate mt-0.5 ${
                        isActive ? 'text-violet-700 font-medium' : 'text-slate-400'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center ml-2 flex-shrink-0">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-violet-200/70 text-violet-800' : 'text-slate-400 group-hover:text-slate-600'
                    }`}>
                      {item.stepNumber}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Clean Minimal Sidebar Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/70">
        <div className={`flex items-center text-[10px] text-slate-400 font-mono ${
          isCollapsed ? 'justify-center' : 'justify-between px-2'
        }`}>
          <span>v2.5</span>
          {!isCollapsed && <span className="text-violet-600 font-semibold">1:1 mm</span>}
        </div>
      </div>
    </aside>
  );
};
