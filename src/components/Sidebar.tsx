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
  section?: 'main' | 'secondary';
}

const NAV_MAIN_ITEMS: NavItem[] = [
  { id: 'PATTERNS', label: 'Molderías', icon: Scissors, section: 'main' },
  { id: 'DESIGNS', label: 'Diseños', icon: Palette, section: 'main' },
  { id: 'NEW_ORDER', label: 'Pedidos', icon: FileSpreadsheet, section: 'main' },
  { id: 'NESTING', label: 'Nesting', icon: LayoutGrid, section: 'main' },
];

const NAV_SECONDARY_ITEMS: NavItem[] = [
  { id: 'HISTORY', label: 'Historial', icon: Clock, section: 'secondary' },
  { id: 'SETTINGS', label: 'Configuración', icon: Settings, section: 'secondary' },
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

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setCurrentView(item.id)}
        title={item.label}
        className={`w-full flex items-center rounded-xl transition-all duration-150 text-xs font-semibold cursor-pointer group ${
          isCollapsed
            ? 'justify-center p-2.5 my-1'
            : 'gap-3 px-3 py-2.5 my-0.5'
        } ${
          isActive
            ? 'bg-violet-50 text-violet-700 shadow-2xs font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-700'
        }`} />

        {!isCollapsed && (
          <span className="truncate text-[13px]">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen flex-shrink-0 select-none z-20 transition-all duration-300 ease-in-out shadow-xs ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-14 px-3 border-b border-slate-100 flex items-center justify-between">
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
                  <span className="text-[9px] font-mono font-bold text-violet-700 bg-violet-50 px-1 py-0.5 rounded border border-violet-200">
                    v2.5
                  </span>
                </h1>
                <div className="text-[10px] text-slate-400 font-medium truncate">
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
          {NAV_MAIN_ITEMS.map(renderNavItem)}

          <div className="my-2 border-t border-slate-100 mx-2" />

          {NAV_SECONDARY_ITEMS.map(renderNavItem)}
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
