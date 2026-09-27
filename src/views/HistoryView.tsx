import React from 'react';
import { Clock, Printer, FileText, Download, CheckCircle, Search } from 'lucide-react';

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
            className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-72"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Proyecto / Equipo</th>
              <th className="py-3 px-4">Diseño Base</th>
              <th className="py-3 px-4">Prendas</th>
              <th className="py-3 px-4">Consumo Papel</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            <tr className="hover:bg-slate-850/50">
              <td className="py-3.5 px-4">
                <div className="font-semibold text-white">Colegio Francia Sub-15</div>
                <div className="text-[11px] text-slate-500">Prof. Roberto Morales • 24/09/2026</div>
              </td>
              <td className="py-3.5 px-4">Holanda Naranja Clásico</td>
              <td className="py-3.5 px-4 font-mono">35 uniformes (172 pzs)</td>
              <td className="py-3.5 px-4 font-mono text-emerald-400">18.42 m (87.6%)</td>
              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Exportado RasterLink
                </span>
              </td>
              <td className="py-3.5 px-4 text-right space-x-2">
                <button
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-medium inline-flex items-center gap-1"
                  title="Reimprimir pieza dañada o faltante"
                >
                  <Printer className="w-3 h-3 text-amber-400" />
                  Reimprimir Pieza
                </button>
                <button
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded border border-emerald-500/30 text-[11px] font-medium inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Descargar PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
