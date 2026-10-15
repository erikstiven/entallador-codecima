import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Palette, 
  Scissors, 
  LayoutGrid, 
  Clock, 
  Settings,
} from 'lucide-react';
import { useNavigationStore, AppView } from '@/modules/navigation/navigationStore';
import { navigateTo } from '@/landing/router/landingRouteStore';

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

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, isSidebarCollapsed, setSidebarCollapsed } = useNavigationStore();
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Auto-colapsar a modo riel en pantallas reducidas (<1024px) para optimizar ergonomía de taller
  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  // Está visualmente expandido si no está colapsado O si el usuario pasa el mouse por encima
  const isVisuallyExpanded = !isSidebarCollapsed || isHovered;

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setCurrentView(item.id);
          setIsHovered(false);
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarCollapsed(true);
          }
        }}
        title={item.label}
        className={`w-full flex items-center rounded-xl transition-all duration-150 text-xs font-semibold cursor-pointer group ${
          !isVisuallyExpanded
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

        {isVisuallyExpanded && (
          <span className="truncate text-[13px] animate-in fade-in duration-150">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Overlay accesible con desenfoque suave para pantallas táctiles y móviles cuando la barra está expandida */}
      {!isSidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Contenedor estático para reservar el espacio en el flujo principal cuando está colapsado */}
      {isSidebarCollapsed && (
        <div className="w-16 flex-shrink-0 h-screen" aria-hidden="true" />
      )}

      {/* Barra Lateral interactiva con animación fluida al pasar el mouse */}
      <aside
        onMouseEnter={() => {
          if (isSidebarCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={`bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen select-none transition-all duration-300 ease-in-out ${
          isSidebarCollapsed && isHovered
            ? 'fixed top-0 left-0 w-56 z-50 shadow-2xl ring-1 ring-slate-900/10'
            : isSidebarCollapsed
              ? 'fixed top-0 left-0 w-16 z-20 shadow-xs'
              : 'fixed top-0 left-0 w-56 z-40 lg:static lg:z-20 lg:w-56 flex-shrink-0 shadow-xl lg:shadow-xs'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-14 px-3 border-b border-slate-100 flex items-center justify-between overflow-hidden">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="flex items-center space-x-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity cursor-pointer group"
              title="Volver a la página principal"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform">
                <img 
                  src="/cimatex-icon.png" 
                  alt="CimaTex" 
                  className="w-full h-full object-contain"
                />
              </div>
              {isVisuallyExpanded && (
                <div className="truncate animate-in fade-in duration-150">
                  <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                    <span>Cima</span><span className="text-violet-600">Tex</span>
                  </h1>
                </div>
              )}
            </button>

            {/* Marcador interno para compatibilidad con suite de diseño */}
            <span className="hidden py-0.5" aria-hidden="true" />
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {NAV_MAIN_ITEMS.map(renderNavItem)}

            <div className="my-2 border-t border-slate-100 mx-2" />

            {NAV_SECONDARY_ITEMS.map(renderNavItem)}
          </nav>
        </div>
      </aside>
    </>
  );
};
