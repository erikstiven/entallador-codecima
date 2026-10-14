import React, { useState } from 'react';
import { 
  Sun, 
  Ruler, 
  CheckCircle2, 
  Building2, 
  Scissors, 
  Layers, 
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Settings as SettingsIcon,
  Factory,
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useSystemSettingsStore, DisplayUnit } from '@/modules/settings/systemSettingsStore';
import { useUnits } from '@/core/units/useUnits';
import { showAlert } from '@/core/ui/alerts';
import { Button } from '@/components/ui/Button';

type SettingsTab = 'SYSTEM' | 'PRODUCTION';

export const SettingsView: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile, updateActiveProfile, addProfile, deleteProfile } = useProfileStore();
  const { settings, updateSettings, resetSettings } = useSystemSettingsStore();
  const { unit, unitLabel, unitStep, precision, toDisplay, toInternalMm, format } = useUnits();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('SYSTEM');
  const [savedFlash, setSavedFlash] = useState(false);

  const triggerSaveNotification = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleUpdateSettings = (updates: Parameters<typeof updateSettings>[0]) => {
    updateSettings(updates);
    triggerSaveNotification();
  };

  const rawToDisplay = toDisplay;
  const displayToMm = toInternalMm;
  const formatValue = (mmVal: number) => format(mmVal);

  return (
    <div className="p-6 w-full space-y-5 pb-16 text-slate-800 animate-in fade-in duration-200">
      {/* Encabezado Principal */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <img 
            src="/cimatex-icon.png" 
            alt="CimaTex" 
            className="w-12 h-12 object-contain filter drop-shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-mono text-xs font-bold uppercase">
                Configuración General
              </span>
              <span
                className={`text-xs font-semibold flex items-center gap-1 transition-opacity duration-300 ${
                  savedFlash ? 'text-violet-600 opacity-100' : 'opacity-0'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Cambios guardados automáticamente
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-2">
              <span>Cima<span className="text-violet-600">Tex</span></span> <span className="text-violet-700 font-medium text-lg bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">PRO</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza la empresa, temas, unidades de medida, parámetros de bobina y tolerancias de corte 1:1
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            const confirmed = await showAlert.confirm(
              '¿Restaurar valores de fábrica?',
              '¿Deseas restaurar todas las configuraciones a los valores predeterminados de fábrica?'
            );
            if (confirmed) {
              resetSettings();
              triggerSaveNotification();
              showAlert.toast('info', 'Ajustes restablecidos');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-amber-600 text-xs transition-colors cursor-pointer shadow-2xs"
          title="Restablecer valores por defecto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Ajustes</span>
        </button>
      </div>

      {/* Selector de Pestañas / Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('SYSTEM')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SYSTEM'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Sistema y Software</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PRODUCTION'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
          }`}
        >
          <Factory className="w-3.5 h-3.5" />
          <span>Producción y Lienzo de Entallado</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* PESTAÑA 1: SISTEMA Y SOFTWARE                                  */}
      {/* ============================================================== */}
      {activeTab === 'SYSTEM' && (
        <div className="space-y-6">
          {/* 1. SECCIÓN: PERFIL DE EMPRESA Y TALLER */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Building2 className="w-4 h-4 text-violet-600" />
              <h3>Perfil de Empresa y Taller Textil</h3>
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              Identificación de tu empresa para reportes de producción, hojas de corte y exportaciones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleUpdateSettings({ companyName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:border-violet-500 shadow-2xs"
                  placeholder="Ej: Codecima"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sede / Taller de Sublimación</label>
                <input
                  type="text"
                  value={settings.workshopName}
                  onChange={(e) => handleUpdateSettings({ workshopName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:border-violet-500 shadow-2xs"
                  placeholder="Ej: Taller Central Codecima"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operador / Diseñador Principal</label>
                <input
                  type="text"
                  value={settings.operatorName}
                  onChange={(e) => handleUpdateSettings({ operatorName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:border-violet-500 shadow-2xs"
                  placeholder="Ej: Diseñador Codecima"
                />
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN: UNIDADES DE MEDIDA Y FORMATO */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Ruler className="w-4 h-4 text-violet-600" />
              <h3>Unidades de Medida y Formato Visual</h3>
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              Define cómo se presentarán e ingresarán las medidas en todo el software (piezas, cotas y lienzos).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
              {/* Unidad Principal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Unidad Principal del Sistema</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mm', 'cm', 'in'] as DisplayUnit[]).map((u) => {
                    const isSelected = settings.displayUnit === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleUpdateSettings({ displayUnit: u })}
                        className={`py-2 px-2.5 rounded-lg border font-mono font-bold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {u === 'mm' ? 'Milímetros (mm)' : u === 'cm' ? 'Centímetros (cm)' : 'Pulgadas (in)'}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  En talleres de confección deportiva se suele trabajar en <strong>centímetros (cm)</strong> o <strong>milímetros (mm)</strong>.
                </span>
              </div>

              {/* Precisión Decimal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Precisión Decimal en Cotas</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((dec) => {
                    const isSelected = settings.decimalPrecision === dec;
                    return (
                      <button
                        key={dec}
                        type="button"
                        onClick={() => handleUpdateSettings({ decimalPrecision: dec })}
                        className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {dec === 0 ? 'Sin decimales' : dec === 1 ? '1 decimal' : '2 decimales'}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  Define el número de cifras decimales que se mostrarán en cotas y tablas informativas.
                </span>
              </div>
            </div>

            {/* Vista Previa Interactiva en Vivo */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
                  Demostración en Tiempo Real
                </span>
                <p className="text-[11px] text-slate-500">
                  Un molde de patronaje con ancho físico de 560 mm se representará en tu pantalla como:
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white border border-violet-200 text-violet-700 px-3.5 py-1.5 rounded-lg font-mono font-bold text-sm shadow-2xs">
                  {format(560)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  (560.0 mm en el motor vectorial)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 2: PRODUCCIÓN Y LIENZO DE ENTALLADO                    */}
      {/* ============================================================== */}
      {activeTab === 'PRODUCTION' && (
        <div className="space-y-6">

      {/* 4. SECCIÓN: MARCO DE TRABAJO / LIENZO DE ENTALLADO */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Layers className="w-4 h-4 text-violet-600" />
            <h3>Marco de Trabajo / Lienzo de Entallado</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-violet-700 bg-violet-50 px-3 py-1 rounded-lg border border-violet-200 shadow-2xs">
              Dimensión Activa: <strong className="text-slate-900">{formatValue(activeProfile.totalRollWidthMm)} x {formatValue(activeProfile.maxHeightMm || 2000)}</strong> {unitLabel}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 -mt-2">
          Configura las dimensiones del marco de trabajo donde se entallarán y distribuirán los moldes para su exportación (SVG, EPS, PDF).
        </p>

        {/* Formatos Guardados y Botón de Agregar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Formatos de Marco de Trabajo
            </label>
            <button
              type="button"
              onClick={() => {
                const newId = `profile_custom_${Date.now()}`;
                const newProfile = {
                  id: newId,
                  name: `Nuevo Marco ${profiles.length + 1}`,
                  totalRollWidthMm: activeProfile.totalRollWidthMm || 1120.0,
                  maxHeightMm: activeProfile.maxHeightMm || 2000.0,
                  leftMarginMm: 0,
                  rightMarginMm: 0,
                  printableWidthMm: activeProfile.totalRollWidthMm || 1120.0,
                  pieceSpacingMm: 7.0,
                  topMarginMm: 0,
                  bottomMarginMm: 0,
                };
                addProfile(newProfile);
                triggerSaveNotification();
                showAlert.toast('success', 'Nuevo formato de lienzo creado');
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Formato de Marco</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {profiles.map((p) => {
              const isSelected = activeProfile.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveProfile(p);
                    triggerSaveNotification();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-violet-50 border-violet-600 text-violet-950 shadow-xs ring-1 ring-violet-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[130px]">{p.name}</span>
                    <div className="flex items-center gap-1">
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                      {profiles.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProfile(p.id);
                            triggerSaveNotification();
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 text-slate-400 transition-all rounded"
                          title="Eliminar este marco"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-violet-700 mt-1">
                    {formatValue(p.totalRollWidthMm)} x {formatValue(p.maxHeightMm || 2000)} {unitLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configuración 100% Manual por Teclado: Ancho y Alto */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-violet-600" />
              Dimensiones del Marco Activo ({unitLabel})
            </span>
            <input
              type="text"
              value={activeProfile.name}
              onChange={(e) => {
                updateActiveProfile({ name: e.target.value });
                triggerSaveNotification();
              }}
              className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-900 focus:outline-none focus:border-violet-500 max-w-[180px] shadow-2xs"
              placeholder="Nombre del marco"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Ancho del Marco */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Ancho del Marco / Lienzo ({unitLabel})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={unitStep}
                  min="10"
                  value={rawToDisplay(activeProfile.totalRollWidthMm)}
                  onChange={(e) => {
                    const rawVal = parseFloat(e.target.value);
                    const mmVal = Number.isFinite(rawVal) ? displayToMm(rawVal) : 0;
                    updateActiveProfile({ 
                      totalRollWidthMm: mmVal,
                      printableWidthMm: mmVal
                    });
                    triggerSaveNotification();
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-violet-500 shadow-2xs"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                  {unitLabel}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Equivalente interno: {activeProfile.totalRollWidthMm} mm
              </span>
            </div>

            {/* Alto del Marco */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Largo / Alto del Marco / Lienzo ({unitLabel})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={unitStep}
                  min="10"
                  value={rawToDisplay(activeProfile.maxHeightMm || 2000)}
                  onChange={(e) => {
                    const rawVal = parseFloat(e.target.value);
                    const mmVal = Number.isFinite(rawVal) ? displayToMm(rawVal) : 0;
                    updateActiveProfile({ maxHeightMm: mmVal });
                    triggerSaveNotification();
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-violet-500 shadow-2xs"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                  {unitLabel}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Equivalente interno: {activeProfile.maxHeightMm || 2000} mm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN: PARÁMETROS DE CORTE Y NESTING */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Scissors className="w-4 h-4 text-violet-600" />
          <h3>Parámetros de Corte y Separación de Moldes (Nesting)</h3>
        </div>
        <p className="text-xs text-slate-500 -mt-2">
          Distancia mínima de seguridad entre piezas para que la cuchilla o corte láser no invada moldes contiguos.
        </p>

        <div className="max-w-md pt-1 text-xs">
          <label className="block font-semibold text-slate-700 mb-1.5">
            Separación de Seguridad entre Piezas ({unitLabel})
          </label>
          <div className="relative">
            <input
              type="number"
              step={unitStep}
              min="1"
              value={rawToDisplay(activeProfile.pieceSpacingMm)}
              onChange={(e) => {
                const rawVal = parseFloat(e.target.value);
                const mmVal = Number.isFinite(rawVal) ? displayToMm(rawVal) : 7.0;
                updateActiveProfile({ pieceSpacingMm: mmVal });
                handleUpdateSettings({ defaultPieceSpacingMm: mmVal });
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-violet-500 shadow-2xs"
            />
            <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
              {unitLabel}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Espacio físico entre moldes al optimizar el lienzo (Recomendado taller: <strong>{formatValue(7.0)} {unitLabel}</strong>).
          </span>
        </div>
      </div>

      {/* 6. SECCIÓN: GUÍAS VISUALES DE INSPECCIÓN TEXTIL */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Eye className="w-4 h-4 text-violet-600" />
          <h3>Guías Visuales de Inspección (Visor de Prendas)</h3>
        </div>
        <p className="text-xs text-slate-500 -mt-2">
          Referencias visuales en pantalla para verificar que franjas, nombres y números no queden atrapados en las costuras o dobleces.
        </p>

        <div className="max-w-md pt-1 text-xs">
          <label className="block font-semibold text-slate-700 mb-1.5">
            Guía de Dobladillo / Basta de Manga ({unitLabel})
          </label>
          <div className="relative">
            <input
              type="number"
              step={unitStep}
              min="0"
              value={rawToDisplay(settings.defaultHemMarginMm)}
              onChange={(e) => {
                const rawVal = parseFloat(e.target.value);
                const mmVal = Number.isFinite(rawVal) ? displayToMm(rawVal) : 20.0;
                handleUpdateSettings({ defaultHemMarginMm: mmVal });
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-violet-500 shadow-2xs"
            />
            <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
              {unitLabel}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Determina la posición de la línea punteada de advertencia de recubridora en el visor de mangas cuando <code>Guías: ON</code> está activo.
          </span>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
