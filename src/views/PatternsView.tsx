import React from 'react';
import { Scissors, Plus, CheckCircle, FileCode, Sliders } from 'lucide-react';

export const PatternsView: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Biblioteca de Moldes Vectoriales</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registra los archivos maestros de moldes de Illustrator por tipo de prenda (MOLDES_FUTBOL_2026.ai / .svg)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
            <FileCode className="w-4 h-4 text-emerald-400" />
            Descargar Script Illustrator (.jsx)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950 transition-colors">
            <Plus className="w-4 h-4" />
            Importar Conjunto de Moldes
          </button>
        </div>
      </div>

      {/* Main Pattern Collection Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-base font-semibold text-white">MOLDES FUTBOL OFICIAL 2026</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                FUTBOL COMPLETO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Archivo fuente: <span className="font-mono text-slate-300">moldes_futbol_2026.svg</span> (Escala 1:1 verificada)
            </p>
          </div>
          <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            Asignador Manual de Piezas
          </button>
        </div>

        {/* Tallas Grid */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Tallas Registradas y Piezas Asociadas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['TALLA 26', 'TALLA 28', 'TALLA 30', 'TALLA 32', 'TALLA S', 'TALLA M', 'TALLA L', 'TALLA XL'].map((talla, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white font-mono">{talla}</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    6 piezas
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                  <div className="flex justify-between"><span>Delantero</span><span className="text-slate-500">0° rot</span></div>
                  <div className="flex justify-between"><span>Espalda</span><span className="text-slate-500">0° rot</span></div>
                  <div className="flex justify-between"><span>Mangas (x2)</span><span className="text-slate-500">0°, 180°</span></div>
                  <div className="flex justify-between"><span>Shorts (x2)</span><span className="text-slate-500">0°, 180°</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
