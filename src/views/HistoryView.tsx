import React from 'react';
import { Clock, Search, Database } from 'lucide-react';

export const HistoryView: React.FC = () => {
  return (
    <div className="p-6 w-full space-y-5 text-slate-800 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Historial de Proyectos y Reimpresión</span>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Consulta pedidos archivados, vuelve a exportar rollos completos o reimprime una pieza puntual
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, equipo o fecha..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 w-72 shadow-2xs font-medium"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3 border border-violet-100 shadow-2xs">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Historial persistente en construcción</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 font-medium">
          Este módulo todavía no registra exportaciones ni permite reposiciones reales. Los datos de demostración fueron retirados para evitar confundirlos con pedidos guardados.
        </p>
      </div>
    </div>
  );
};
