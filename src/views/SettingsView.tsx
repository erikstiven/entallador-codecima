import React from 'react';
import { Sliders, Save, Ruler, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';

export const SettingsView: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile, updateActiveProfile } = useProfileStore();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Configuración de Producción y Parámetros de Bobina</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ajusta las medidas físicas del papel transfer y los márgenes de seguridad para el plotter Epson
        </p>
      </div>

      {/* Profile Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Perfil de Bobina Activo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {profiles.map((p) => {
            const isSelected = activeProfile.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProfile(p)}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{p.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 mt-1">
                  Útil: {p.printableWidthMm} mm
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Dimensions Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-sm font-semibold text-slate-200">
          Medidas Físicas y Separación para: <span className="text-emerald-400">{activeProfile.name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Ancho total del papel */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Ancho Total del Rollo de Papel (mm)
            </label>
            <input
              type="number"
              value={activeProfile.totalRollWidthMm}
              onChange={(e) => updateActiveProfile({ totalRollWidthMm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Equivale a: {(activeProfile.totalRollWidthMm / 10).toFixed(1)} cm
            </span>
          </div>

          {/* Separación entre piezas */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Separación de Seguridad entre Piezas (mm)
            </label>
            <input
              type="number"
              step="0.5"
              value={activeProfile.pieceSpacingMm}
              onChange={(e) => updateActiveProfile({ pieceSpacingMm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Estándar recomendado de taller: 7.0 mm (0.7 cm)
            </span>
          </div>

          {/* Margen Izquierdo */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Margen Pinza Izquierda (mm)
            </label>
            <input
              type="number"
              value={activeProfile.leftMarginMm}
              onChange={(e) => updateActiveProfile({ leftMarginMm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Equivale a: {(activeProfile.leftMarginMm / 10).toFixed(1)} cm
            </span>
          </div>

          {/* Margen Derecho */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Margen Pinza Derecha (mm)
            </label>
            <input
              type="number"
              value={activeProfile.rightMarginMm}
              onChange={(e) => updateActiveProfile({ rightMarginMm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Equivale a: {(activeProfile.rightMarginMm / 10).toFixed(1)} cm
            </span>
          </div>
        </div>

        {/* Calculated Printable Area Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ruler className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-white">Área Útil de Impresión Calculada</div>
              <div className="text-[11px] text-emerald-300">
                Límite físico estricto para el nesting automático
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono text-emerald-400">
              {activeProfile.printableWidthMm} mm
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              ({(activeProfile.printableWidthMm / 10).toFixed(1)} cm)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
