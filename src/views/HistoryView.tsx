import React from 'react';
import { Clock, Search, Database } from 'lucide-react';

export const HistoryView: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Historial de Proyectos y Reimpresión</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consulta pedidos archivados, vuelve a exportar rollos completos o reimprime una pieza puntual
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, equipo o fecha..."
            className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-72"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Database className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-white">Historial persistente en construcción</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto mt-2">
          Este módulo todavía no registra exportaciones ni permite reposiciones reales. Los datos de demostración fueron retirados para evitar confundirlos con pedidos guardados.
        </p>
      </div>
    </div>
  );
};
