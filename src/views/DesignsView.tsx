import React from 'react';
import { Palette, Plus, Layers, Image as ImageIcon } from 'lucide-react';

interface DesignCard {
  id: string;
  name: string;
  sport: string;
  colors: string[];
  piecesCount: number;
}

const SAMPLE_DESIGNS: DesignCard[] = [
  { id: 'des_holanda', name: 'Holanda Naranja Clásico', sport: 'Fútbol', colors: ['#ea580c', '#0284c7', '#ffffff'], piecesCount: 6 },
  { id: 'des_brasil', name: 'Brasil Amarillo Canarinho', sport: 'Fútbol', colors: ['#eab308', '#16a34a', '#1e40af'], piecesCount: 6 },
  { id: 'des_argentina', name: 'Argentina Albiceleste', sport: 'Fútbol', colors: ['#38bdf8', '#ffffff', '#000000'], piecesCount: 6 },
  { id: 'des_barca', name: 'Barcelona Blaugrana', sport: 'Fútbol', colors: ['#991b1b', '#1e3a8a', '#eab308'], piecesCount: 6 },
];

export const DesignsView: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Biblioteca de Diseños Maestros</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registra los archivos vectoriales base de Illustrator (.ai / .svg) con sus zonas de dorsal y escudo
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950 transition-colors">
          <Plus className="w-4 h-4" />
          Registrar Nuevo Diseño
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_DESIGNS.map((d) => (
          <div
            key={d.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all group"
          >
            {/* Visual Pattern Mock Preview */}
            <div className="h-36 bg-slate-950 p-4 flex flex-col justify-between border-b border-slate-800 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {d.sport}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {d.piecesCount} piezas vectoriales
                </span>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-1.5 mt-auto">
                {d.colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Design Info */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                {d.name}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Placeholders: <span className="text-slate-200 font-mono">&#123;&#123;NOMBRE&#125;&#125;, &#123;&#123;NUMERO&#125;&#125;</span></span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium">
                  Ver capas vectoriales
                </button>
                <button className="text-[11px] text-slate-400 hover:text-slate-200">
                  Editar reglas
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
