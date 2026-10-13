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
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between select-none z-10 transition-colors">
      {/* Título y Subtítulo de Vista Activa */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
          {info.title}
        </h2>
        <p className="text-[11px] text-slate-400 hidden sm:block -mt-0.5">{info.subtitle}</p>
      </div>

      {/* Derecha: Acceso a Landing, Badge de Empresa, Operador y Selector de Tema */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateTo('/landing')}
          className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Ir a la página web de presentación (Landing)"
        >
          <Globe className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Ver Landing</span>
        </button>

        {/* Badge de Empresa y Operador */}
        <button
          type="button"
          onClick={() => setCurrentView('SETTINGS')}
          className="flex items-center gap-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-full px-3 py-1 text-xs transition-all cursor-pointer group"
          title="Ver perfil de empresa y ajustes de usuario"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-700 via-purple-600 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
            {settings.companyName.substring(0, 2).toUpperCase() || 'CD'}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-white font-bold text-[11px] leading-tight group-hover:text-violet-300 transition-colors">
              {settings.companyName || 'Codecima'}
            </div>
            <div className="text-[9px] text-slate-400 font-mono leading-none">
              {settings.operatorName || 'Operador'}
            </div>
          </div>
        </button>

        {/* Switcher de Tema */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-violet-400 transition-transform hover:-rotate-12" />
          )}
        </button>
      </div>
    </header>
  );
};
