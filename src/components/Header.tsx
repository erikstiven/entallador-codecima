import React from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { useThemeStore } from '@/modules/settings/themeStore';
import { useSystemSettingsStore } from '@/modules/settings/systemSettingsStore';
import { navigateTo } from '@/landing/router/landingRouteStore';

export const Header: React.FC = () => {
  const { currentView, setCurrentView } = useNavigationStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings } = useSystemSettingsStore();

  const getTitle = () => {
    switch (currentView) {
      case 'NEW_ORDER':
        return { 
          title: 'Gestión de Pedidos', 
          subtitle: 'Nómina de jugadores, números y tallas',
        };
      case 'DESIGNS':
        return { 
          title: 'Diseños Maestros', 
          subtitle: 'Artes vectoriales y tipografías',
        };
      case 'PATTERNS':
        return { 
          title: 'Moldes & Patrones', 
          subtitle: 'Curvas de corte 1:1 por talla',
        };
      case 'NESTING':
        return { 
          title: 'Entallado & Nesting', 
          subtitle: 'Acomodo y optimización de bobina',
        };
      case 'HISTORY':
        return { 
          title: 'Historial de Producción', 
          subtitle: 'Registro de rollos y reposición de piezas',
        };
      case 'SETTINGS':
        return { 
          title: 'Configuración', 
          subtitle: 'Empresa, bobinas y tolerancias',
        };
    }
  };

  const info = getTitle();

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-5 flex items-center justify-between select-none z-10 transition-colors shadow-2xs">
      {/* Título y Subtítulo de Vista Activa */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          {info.title}
        </h2>
        <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5">{info.subtitle}</p>
      </div>

      {/* Derecha: Acceso a Landing, Badge de Empresa y Operador */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigateTo('/landing')}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
          title="Ir a la página web de presentación (Landing)"
        >
          <Globe className="w-3.5 h-3.5 text-violet-600" />
          <span className="hidden sm:inline">Ver Landing</span>
        </button>

        {/* Badge de Empresa y Operador */}
        <button
          type="button"
          onClick={() => setCurrentView('SETTINGS')}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer group shadow-xs"
          title="Ver perfil de empresa y ajustes de usuario"
        >
          <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
            {settings.companyName.substring(0, 2).toUpperCase() || 'CD'}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-slate-900 font-bold text-[11px] leading-tight group-hover:text-violet-600 transition-colors">
              {settings.companyName || 'Codecima'}
            </div>
            <div className="text-[9px] text-slate-500 font-mono leading-none">
              {settings.operatorName || 'Operador'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
