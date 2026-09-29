import React from 'react';
import { useNavigationStore } from '@/modules/navigation/navigationStore';

export const Header: React.FC = () => {
  const { currentView } = useNavigationStore();

  const getTitle = () => {
    switch (currentView) {
      case 'NEW_ORDER':
        return { title: 'Nuevo Pedido de Uniformes', subtitle: 'Carga el Excel del pedido y valida la nómina de jugadores' };
      case 'DESIGNS':
        return { title: 'Biblioteca de Diseños Maestros', subtitle: 'Patrones artísticos, dorsales y placeholders' };
      case 'PATTERNS':
        return { title: 'Moldes', subtitle: 'Patrones base y contornos de corte por talla (cm)' };
      case 'NESTING':
        return { title: 'Lienzo de Entallado y Nesting 2D', subtitle: 'Optimización de consumo sobre bobina continua' };
      case 'HISTORY':
        return { title: 'Historial de Producción', subtitle: 'Pedidos archivados y re-impresión de piezas individuales' };
      case 'SETTINGS':
        return { title: 'Configuración de Producción', subtitle: 'Anchos de bobina, márgenes y tolerancias de corte' };
    }
  };

  const info = getTitle();

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between select-none">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">{info.title}</h2>
        <p className="text-xs text-slate-400">{info.subtitle}</p>
      </div>
    </header>
  );
};
