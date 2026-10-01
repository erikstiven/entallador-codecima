import React, { useEffect, useState } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Ruler, 
  CheckCircle2, 
  Building2, 
  Scissors, 
  Layers, 
  Tag, 
  FileCode2, 
  Printer, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useThemeStore, applyThemeToDocument, ThemeMode } from '@/modules/settings/themeStore';
import { useSystemSettingsStore, DisplayUnit, ExportFormatPref, GroupingModePref } from '@/modules/settings/systemSettingsStore';

type ThemeSelection = ThemeMode | 'system';

const THEME_OPTIONS: Array<{
  id: ThemeSelection;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'light', label: 'Modo Claro', description: 'Alto contraste, ideal para revisar artes oscuros o amarillos', icon: Sun },
  { id: 'dark', label: 'Modo Oscuro', description: 'Menor fatiga visual durante jornadas largas de producción', icon: Moon },
  { id: 'system', label: 'Sincronizar con Windows', description: 'Cambia automáticamente según el tema de tu PC', icon: Monitor },
];

export const SettingsView: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile, updateActiveProfile } = useProfileStore();
  const { theme, setTheme } = useThemeStore();
  const { settings, updateSettings, resetSettings } = useSystemSettingsStore();
  
  const [savedFlash, setSavedFlash] = useState(false);
  const [systemPrefersLight, setSystemPrefersLight] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches === true
  );

  // Reaccionar a cambios del sistema operativo
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!media) return;
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersLight(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const activeThemeId: ThemeSelection = THEME_OPTIONS.some((option) => option.id === theme)
    ? theme
    : 'system';

  const triggerSaveNotification = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const selectTheme = (optionId: ThemeSelection) => {
    if (optionId === 'system') {
      try {
        localStorage.removeItem('hmb_theme');
      } catch {
        // Sin persistencia disponible
      }
      const resolved = systemPrefersLight ? 'light' : 'dark';
      useThemeStore.setState({ theme: resolved });
      applyThemeToDocument(resolved);
    } else {
      setTheme(optionId);
    }
    triggerSaveNotification();
  };

  const handleUpdateSettings = (updates: Parameters<typeof updateSettings>[0]) => {
    updateSettings(updates);
    triggerSaveNotification();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-16 text-slate-200">
      {/* Encabezado Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-violet-500/20 text-purple-400 font-mono text-xs font-bold uppercase">
              Configuración General
            </span>
            <span
              className={`text-xs font-semibold flex items-center gap-1 transition-opacity duration-300 ${
                savedFlash ? 'text-purple-400 opacity-100' : 'opacity-0'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Cambios guardados automáticamente
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            CimaPattern <span className="text-purple-400 font-medium">PRO</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personaliza la empresa, temas, unidades de medida, parámetros de bobina y tolerancias de corte 1:1
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('¿Deseas restaurar todas las configuraciones a los valores predeterminados de fábrica?')) {
              resetSettings();
              triggerSaveNotification();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 text-xs transition-colors cursor-pointer"
          title="Restablecer valores por defecto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Ajustes</span>
        </button>
      </div>

      {/* 1. SECCIÓN: PERFIL DE EMPRESA Y TALLER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Building2 className="w-4 h-4 text-purple-400" />
          <h3>Perfil de Empresa y Taller Textil</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Identificación de tu empresa para reportes de producción, hojas de corte y exportaciones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Empresa</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleUpdateSettings({ companyName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-violet-500"
              placeholder="Ej: Codecima"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sede / Taller de Sublimación</label>
            <input
              type="text"
              value={settings.workshopName}
              onChange={(e) => handleUpdateSettings({ workshopName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-violet-500"
              placeholder="Ej: Taller Central Codecima"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operador / Diseñador Principal</label>
            <input
              type="text"
              value={settings.operatorName}
              onChange={(e) => handleUpdateSettings({ operatorName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-violet-500"
              placeholder="Ej: Diseñador Codecima"
            />
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: TEMA Y APARIENCIA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3>Apariencia y Tema del Sistema</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Selecciona el contraste visual que mejor se adapte a la iluminación de tu puesto de trabajo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {THEME_OPTIONS.map((option) => {
            const isSelected = activeThemeId === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectTheme(option.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/60 border-violet-500 text-white shadow-md shadow-purple-950/40 ring-1 ring-violet-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 font-bold text-xs text-white">
                    <Icon className="w-4 h-4 text-purple-400" />
                    {option.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{option.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECCIÓN: UNIDADES DE MEDIDA Y FORMATO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Ruler className="w-4 h-4 text-purple-400" />
          <h3>Unidades de Medida y Formato Visual</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Establece cómo se muestran las dimensiones en el lienzo, tablas y tarjetas de piezas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
          {/* Unidad Preferida */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Unidad Principal de Visualización</label>
            <div className="grid grid-cols-3 gap-2">
              {(['mm', 'cm', 'in'] as DisplayUnit[]).map((u) => {
                const isSelected = settings.displayUnit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleUpdateSettings({ displayUnit: u })}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-purple-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {u === 'mm' ? 'Milímetros (mm)' : u === 'cm' ? 'Centímetros (cm)' : 'Pulgadas (in)'}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              En sublimación deportiva industrial se recomienda trabajar en <strong>milímetros (mm)</strong> para precisión exacta 1:1.
            </span>
          </div>

          {/* Precisión Decimal */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Precisión Decimal en Cotas</label>
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
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-purple-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {dec === 0 ? 'Sin decimales (1120)' : dec === 1 ? '1 decimal (1120.0)' : '2 decimales (1120.00)'}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              Controla el redondeo de medidas de piezas y rollos en las pantallas informativas.
            </span>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN: PERFILES DE BOBINA Y PLOTTER EPSON */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Printer className="w-4 h-4 text-purple-400" />
            <h3>Perfiles de Bobina y Plotter de Impresión</h3>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800">
            Área Útil: {activeProfile.printableWidthMm} mm ({(activeProfile.printableWidthMm / 10).toFixed(1)} cm)
          </span>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Selecciona el perfil de bobina activo y ajusta las pinzas de seguridad para evitar descalibre del cabezal.
        </p>

        {/* Selector de perfiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {profiles.map((p) => {
            const isSelected = activeProfile.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActiveProfile(p);
                  triggerSaveNotification();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/60 border-violet-500 text-white shadow-md shadow-purple-950 ring-1 ring-violet-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{p.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="text-[11px] font-mono text-purple-400 mt-1">
                  Área Imprimible: {p.printableWidthMm} mm
                </div>
              </button>
            );
          })}
        </div>

        {/* Editor de medidas del perfil activo */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Ancho Total Bobina (mm)</label>
            <input
              type="number"
              value={activeProfile.totalRollWidthMm}
              onChange={(e) => {
                updateActiveProfile({ totalRollWidthMm: parseFloat(e.target.value) || 0 });
                triggerSaveNotification();
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {(activeProfile.totalRollWidthMm / 10).toFixed(1)} cm
            </span>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Margen Pinza Izquierda (mm)</label>
            <input
              type="number"
              value={activeProfile.leftMarginMm}
              onChange={(e) => {
                updateActiveProfile({ leftMarginMm: parseFloat(e.target.value) || 0 });
                triggerSaveNotification();
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {(activeProfile.leftMarginMm / 10).toFixed(1)} cm
            </span>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Margen Pinza Derecha (mm)</label>
            <input
              type="number"
              value={activeProfile.rightMarginMm}
              onChange={(e) => {
                updateActiveProfile({ rightMarginMm: parseFloat(e.target.value) || 0 });
                triggerSaveNotification();
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {(activeProfile.rightMarginMm / 10).toFixed(1)} cm
            </span>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN: CONFECCIÓN, DOBLADILLOS Y NESTING */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Scissors className="w-4 h-4 text-purple-400" />
          <h3>Tolerancias de Confección, Dobladillos y Nesting</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Valores predeterminados de separación entre piezas y compensación de dobladillos para mangas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Separación de Seguridad entre Piezas (mm)
            </label>
            <input
              type="number"
              step="0.5"
              min="2"
              max="20"
              value={activeProfile.pieceSpacingMm}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 7.0;
                updateActiveProfile({ pieceSpacingMm: val });
                handleUpdateSettings({ defaultPieceSpacingMm: val });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Espacio entre moldes en el rollo de impresión (Recomendado taller: <strong>7.0 mm</strong>).
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Basta / Dobladillo Estándar de Manga (mm)
            </label>
            <input
              type="number"
              step="1"
              min="10"
              max="35"
              value={settings.defaultHemMarginMm}
              onChange={(e) => handleUpdateSettings({ defaultHemMarginMm: parseFloat(e.target.value) || 20.0 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Compensación vertical para que las franjas y texturas de manga queden en el borde exterior sin taparse.
            </span>
          </div>
        </div>
      </div>

      {/* 6. SECCIÓN: ETIQUETAS DE IDENTIFICACIÓN Y EXPORTACIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Tag className="w-4 h-4 text-purple-400" />
          <h3>Etiquetas de Identificación Textil y Exportación 1:1</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Control de marcado automático en las piezas para clasificación rápida en la mesa de costura.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.autoIncludeLabels}
                onChange={(e) => handleUpdateSettings({ autoIncludeLabels: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500"
              />
              <span className="font-semibold text-slate-200">
                Imprimir etiquetas automáticas fuera de la costura
              </span>
            </label>
            <p className="text-[11px] text-slate-500 pl-6">
              Añade texto con <code>NOMBRE | #NUMERO | TALLA | PIEZA</code> debajo de cada molde para el equipo de confección.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Formato Predeterminado de Exportación</label>
            <div className="grid grid-cols-3 gap-2">
              {(['SVG', 'PDF', 'EPS'] as ExportFormatPref[]).map((fmt) => {
                const isSelected = settings.defaultExportFormat === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleUpdateSettings({ defaultExportFormat: fmt })}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-purple-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {fmt === 'SVG' ? 'SVG (Illustrator)' : fmt === 'PDF' ? 'PDF RasterLink' : 'EPS Vector'}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              SVG 1:1 abre instantáneamente en Adobe Illustrator sin desconfigurar tipografías ni capas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
