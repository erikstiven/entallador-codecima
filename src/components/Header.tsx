import React from 'react';
import { ShieldCheck, HardDrive, Cpu, Ruler } from 'lucide-react';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { useProfileStore } from '@/modules/settings/profileStore';

export const Header: React.FC = () => {
  const { currentView } = useNavigationStore();
  const { activeProfile } = useProfileStore();

  const getTitle = () => {
    switch (currentView) {
      case 'NEW_ORDER':
        return { title: 'Nuevo Pedido de Uniformes', subtitle: 'Carga el Excel del pedido y valida la nómina de jugadores' };
      case 'DESIGNS':
        return { title: 'Biblioteca de Diseños Maestros', subtitle: 'Patrones artísticos, dorsales y placeholders' };
      case 'PATTERNS':
        return { title: 'Biblioteca de Moldes Vectoriales', subtitle: 'Geometrías por talla y contornos de corte 1:1' };
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
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between select-none">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">{info.title}</h2>
        <p className="text-xs text-slate-400">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Profile Pill */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
          <Ruler className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-300 font-medium">{activeProfile.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold">
            {activeProfile.printableWidthMm} mm útil
          </span>
        </div>

        {/* Scale 1:1 Certified Badge */}
        <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg text-xs text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[11px]">Escala 1:1 Certificada</span>
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-lg text-xs text-slate-400">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px]">SQLite Local</span>
        </div>
      </div>
    </header>
  );
};
