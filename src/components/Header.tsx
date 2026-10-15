import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  Settings,
  History,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { useSystemSettingsStore } from '@/modules/settings/systemSettingsStore';
import { useAuthStore } from '@/landing/auth/authStore';
import { navigateTo } from '@/landing/router/landingRouteStore';
import { getRoleTheme } from '@/core/theme/userRoleTokens';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: 'success' | 'info' | 'warning';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Moldería importada con éxito',
    description: 'Camiseta de fútbol Cuello V (6 tallas, 24 piezas) lista.',
    time: 'Hace 5 min',
    unread: true,
    type: 'success',
  },
  {
    id: 'notif_2',
    title: 'Nómina de pedido sincronizada',
    description: '18 jugadores y dorsales validados sin inconsistencias.',
    time: 'Hace 20 min',
    unread: true,
    type: 'info',
  },
  {
    id: 'notif_3',
    title: 'Optimización de nesting lista',
    description: 'Eficiencia estimada del 84.5% en bobina de 1600 mm.',
    time: 'Hace 1 hora',
    unread: true,
    type: 'warning',
  },
];

export const Header: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useNavigationStore();
  const { settings } = useSystemSettingsStore();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar popovers al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

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
      default:
        return {
          title: 'Taller Textil',
          subtitle: 'Producción & Estampado 1:1',
        };
    }
  };

  const info = getTitle();

  // Nombre y Rol institucional estilo 1:1 con SIFEF
  const displayName = authUser?.name || 'Usuario CimaTex';
  const displayRole = authUser?.role || 'ADMINISTRADOR';
  const roleTheme = getRoleTheme(displayRole);
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'UC';

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between select-none z-30 transition-colors">
      {/* Botón de Colapsar/Expandir Barra Lateral y Título de Vista Activa */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
            {info.title}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5 truncate">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Derecha: Campana de Notificaciones, Separador y Perfil Usuario (1:1 SIFEF) */}
      <div className="flex items-center gap-3">

        {/* Campana de Notificaciones con Badge */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsUserMenuOpen(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute 1 top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Menú desplegable de Notificaciones */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-violet-600 hover:text-violet-800 font-medium cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No tienes notificaciones pendientes
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer ${
                        item.unread ? 'bg-violet-50/20' : ''
                      }`}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                        );
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : item.type === 'warning' ? (
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-sky-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-800 text-xs truncate">
                            {item.title}
                          </p>
                          {item.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador vertical */}
        <div className="h-7 w-px bg-slate-200 mx-0.5" />

        {/* Perfil de Usuario con Avatar Circular Oscuro, Nombre, Rol y Chevron */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-3 py-1 px-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            title="Opciones de cuenta"
          >
            {/* Avatar Circular con estilos de rol centralizados */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-white transition-all ${roleTheme.avatarClass}`}>
              {displayInitials}
            </div>

            {/* Nombre y Rol apilados */}
            <div className="text-left hidden md:block">
              <div className="text-slate-900 font-extrabold text-xs tracking-tight leading-tight group-hover:text-violet-600 transition-colors">
                {displayName}
              </div>
              <div className={`text-[9px] font-mono tracking-wider font-bold uppercase leading-none mt-0.5 ${roleTheme.textClass}`}>
                {displayRole}
              </div>
            </div>

            {/* Flecha Chevron desplegable */}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-150 ${
                isUserMenuOpen ? 'rotate-180 text-slate-900' : ''
              }`}
            />
          </button>

          {/* Menú desplegable del Perfil */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 text-xs">{displayName}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {authUser?.email || `${settings.companyName.toLowerCase() || 'usuario'}@codecima.com`}
                </p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold font-mono rounded-md uppercase tracking-wider ${roleTheme.badgeClass}`}>
                  {displayRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setCurrentView('SETTINGS');
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Configuración del Sistema</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setCurrentView('HISTORY');
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Historial de Producción</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    navigateTo('/');
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
