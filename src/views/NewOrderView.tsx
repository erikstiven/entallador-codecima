import React from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';

export const NewOrderView: React.FC = () => {
  const { activeProfile } = useProfileStore();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Paso 1 de 4</span>
          <h2 className="text-xl font-bold text-white mt-1">Cargar Nómina y Pedido de Uniformes</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Importa el archivo Excel (.xlsx o .csv) con la lista de jugadores. El sistema validará
            automáticamente nombres, números, tallas existentes y disponibilidad de moldes.
          </p>
        </div>
        <div className="text-right border-l border-slate-700 pl-6 hidden md:block">
          <div className="text-xs text-slate-400">Perfil de Bobina Activo</div>
          <div className="text-base font-semibold text-white">{activeProfile.name}</div>
          <div className="text-xs text-emerald-400 font-mono mt-0.5">
            Ancho útil: {activeProfile.printableWidthMm} mm
          </div>
        </div>
      </div>

      {/* Project Basic Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-xs">
          Datos Generales del Pedido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre del Cliente / Contacto</label>
            <input
              type="text"
              placeholder="Ej: Prof. Roberto Morales"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Equipo / Escuela Deportiva</label>
            <input
              type="text"
              placeholder="Ej: Colegio Francia Sub-15"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Deporte / Disciplina</label>
            <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="FUTBOL">Fútbol / Microfútbol</option>
              <option value="BASKET">Básquetbol</option>
              <option value="VOLEY">Voleibol</option>
              <option value="CICLISMO">Ciclismo</option>
              <option value="ATLETISMO">Atletismo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Excel Drag & Drop Zone */}
      <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/50 hover:bg-slate-900 transition-all rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer group">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-white">Arrastra aquí tu archivo Excel o haz clic para explorar</h4>
        <p className="text-xs text-slate-400 mt-1.5 max-w-md">
          Soporta formatos <span className="text-slate-200 font-mono">.xlsx</span> y{' '}
          <span className="text-slate-200 font-mono">.csv</span>. Las columnas esperadas son:{' '}
          <span className="text-emerald-400 font-semibold">Talla, Nombre, Numero, Tipo</span>.
        </p>
        <button className="mt-5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-colors">
          Seleccionar Archivo Excel
        </button>
      </div>

      {/* Expected Format Guidance */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-slate-200 font-medium">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Ejemplo de estructura recomendada para el Excel:
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded-lg">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-700">Talla</th>
                <th className="p-2 border-r border-slate-700">Nombre</th>
                <th className="p-2 border-r border-slate-700">Numero</th>
                <th className="p-2 border-r border-slate-700">Tipo</th>
                <th className="p-2">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-400">
              <tr>
                <td className="p-2 border-r border-slate-800 font-semibold text-slate-200">28</td>
                <td className="p-2 border-r border-slate-800 text-slate-200">MATEO</td>
                <td className="p-2 border-r border-slate-800 text-emerald-400">10</td>
                <td className="p-2 border-r border-slate-800">COMPLETO</td>
                <td className="p-2">Capitán</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-800 font-semibold text-slate-200">30</td>
                <td className="p-2 border-r border-slate-800 text-slate-200">CHRISTOPHER</td>
                <td className="p-2 border-r border-slate-800 text-emerald-400">7</td>
                <td className="p-2 border-r border-slate-800">CAMISETA</td>
                <td className="p-2">Nombre largo (auto-ajuste)</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-800 font-semibold text-slate-200">32</td>
                <td className="p-2 border-r border-slate-800 text-slate-200">DANIELA</td>
                <td className="p-2 border-r border-slate-800 text-emerald-400">15</td>
                <td className="p-2 border-r border-slate-800">COMPLETO</td>
                <td className="p-2">Femenino</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
