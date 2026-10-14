import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Type, 
  UploadCloud, 
  Info, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  Search, 
  Pipette,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { POPULAR_SPORTS_FONTS } from '@/core/fonts/googleFonts';
import { CMYK, hexToCmyk, cmykToHex } from '@/core/color/cmykColor';

interface DorsalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFontFamily: string;
  onSelectFont: (font: string) => void;
  localFonts: string[];
  onUploadFontFile: (file: File) => void;
  fillHex: string;
  fillCmyk: CMYK;
  onFillHexChange: (hex: string) => void;
  onFillCmykChange: (channel: keyof CMYK, val: number) => void;
  sampleName: string;
  onSampleNameChange: (val: string) => void;
  sampleNumber: string;
  onSampleNumberChange: (val: string) => void;
}

const PRESET_DORSAL_COLORS = [
  { name: 'Blanco', hex: '#FFFFFF', cmyk: { c: 0, m: 0, y: 0, k: 0 } },
  { name: 'Negro', hex: '#000000', cmyk: { c: 0, m: 0, y: 0, k: 100 } },
  { name: 'Dorado Pro', hex: '#F59E0B', cmyk: { c: 0, m: 35, y: 95, k: 0 } },
  { name: 'Amarillo Flúor', hex: '#FACC15', cmyk: { c: 0, m: 0, y: 90, k: 0 } },
  { name: 'Rojo Furia', hex: '#DC2626', cmyk: { c: 0, m: 90, y: 90, k: 10 } },
  { name: 'Azul Real', hex: '#2563EB', cmyk: { c: 90, m: 65, y: 0, k: 0 } },
  { name: 'Azul Marino', hex: '#1E3A8A', cmyk: { c: 100, m: 85, y: 20, k: 45 } },
  { name: 'Verde Neón', hex: '#22C55E', cmyk: { c: 65, m: 0, y: 100, k: 0 } },
  { name: 'Naranja', hex: '#EA580C', cmyk: { c: 0, m: 75, y: 100, k: 0 } },
  { name: 'Plata / Gris', hex: '#94A3B8', cmyk: { c: 35, m: 25, y: 20, k: 0 } },
];

export const DorsalConfigModal: React.FC<DorsalConfigModalProps> = ({
  isOpen,
  onClose,
  activeFontFamily,
  onSelectFont,
  localFonts,
  onUploadFontFile,
  fillHex,
  fillCmyk,
  onFillHexChange,
  onFillCmykChange,
  sampleName,
  onSampleNameChange,
  sampleNumber,
  onSampleNumberChange,
}) => {
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [previewBg, setPreviewBg] = useState<'dark' | 'light'>('dark');
  const [isFontSelectOpen, setIsFontSelectOpen] = useState<boolean>(false);
  const [fontSearch, setFontSearch] = useState<string>('');
  const [showAdvancedCmyk, setShowAdvancedCmyk] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontSelectRef = useRef<HTMLDivElement>(null);

  // Cerrar el selector de fuentes al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontSelectRef.current && !fontSelectRef.current.contains(event.target as Node)) {
        setIsFontSelectOpen(false);
      }
    };
    if (isFontSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFontSelectOpen]);

  if (!isOpen) return null;

  // Filtrado de fuentes
  const filteredLocalFonts = localFonts.filter((f) =>
    f.toLowerCase().includes(fontSearch.toLowerCase())
  );
  const filteredPopularFonts = POPULAR_SPORTS_FONTS.filter(
    (f) =>
      f.family.toLowerCase().includes(fontSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(fontSearch.toLowerCase())
  );

  const activeFontObj = POPULAR_SPORTS_FONTS.find((f) => f.family === activeFontFamily);

  // Aplicar un color predefinido
  const handleApplyPresetColor = (preset: typeof PRESET_DORSAL_COLORS[0]) => {
    onFillHexChange(preset.hex);
    onFillCmykChange('c', preset.cmyk.c);
    onFillCmykChange('m', preset.cmyk.m);
    onFillCmykChange('y', preset.cmyk.y);
    onFillCmykChange('k', preset.cmyk.k);
    if (preset.hex === '#000000' || preset.hex === '#1E3A8A') {
      setPreviewBg('light');
    } else {
      setPreviewBg('dark');
    }
  };

  // Cambio bidireccional en canal CMYK -> recalcula HEX
  const handleCmykChannelChange = (channel: keyof CMYK, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const nextCmyk = { ...fillCmyk, [channel]: clamped };
    onFillCmykChange(channel, clamped);
    const calculatedHex = cmykToHex(nextCmyk);
    onFillHexChange(calculatedHex);
  };

  // Cambio bidireccional en HEX -> recalcula CMYK
  const handleHexInputChange = (hexVal: string) => {
    onFillHexChange(hexVal);
    if (/^#?[0-9A-Fa-f]{6}$/.test(hexVal)) {
      const formattedHex = hexVal.startsWith('#') ? hexVal : `#${hexVal}`;
      const newCmyk = hexToCmyk(formattedHex);
      onFillCmykChange('c', newCmyk.c);
      onFillCmykChange('m', newCmyk.m);
      onFillCmykChange('y', newCmyk.y);
      onFillCmykChange('k', newCmyk.k);
    }
  };

  const totalInkCoverage = (fillCmyk.c || 0) + (fillCmyk.m || 0) + (fillCmyk.y || 0) + (fillCmyk.k || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Configuración de Dorsal y Tipografía
              </h3>
              <p className="text-xs text-slate-500">
                Ajusta la fuente y el color vectorial para nombres y números de la espalda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto min-h-0">
          {/* Fila 1: Selector de Tipografía Dinámico (Select 2 con Vista Previa en Vivo) */}
          <div className="space-y-2 relative" ref={fontSelectRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-violet-600" />
                <span>Tipografía de Dorsal:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                ¿Cómo descargar fuentes de Google?
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Trigger de Select 2 Dinámico */}
              <button
                type="button"
                onClick={() => setIsFontSelectOpen((prev) => !prev)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-xl px-3.5 py-2 text-left flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-bold text-xs text-slate-900">{activeFontFamily}</span>
                  {activeFontObj && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200/80">
                      {activeFontObj.category}
                    </span>
                  )}
                  <span
                    className="text-xs text-violet-700 font-bold px-2 py-0.5 bg-violet-50 rounded-md border border-violet-100 hidden sm:inline"
                    style={{ fontFamily: activeFontFamily }}
                  >
                    10 MESSI
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${
                    isFontSelectOpen ? 'rotate-180 text-violet-600' : ''
                  }`}
                />
              </button>

              {/* Botón de Subir Fuente TTF/OTF */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFontFile(f);
                }}
                accept=".ttf,.otf,.woff,.woff2,.font"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap active:scale-95 shrink-0"
                title="Subir archivo .ttf, .otf o .font"
              >
                <UploadCloud className="w-4 h-4 text-white" />
                <span>Subir Fuente</span>
              </button>
            </div>

            {/* Panel Desplegable Flotante de Select 2 */}
            {isFontSelectOpen && (
              <div className="absolute top-full left-0 right-14 sm:right-32 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col">
                {/* Buscador de Fuentes */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Buscar por nombre o estilo (ej. Bebas, Racing, Retro)..."
                    className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none py-1"
                  />
                  {fontSearch && (
                    <button
                      type="button"
                      onClick={() => setFontSearch('')}
                      className="p-1 hover:bg-slate-200 text-slate-400 rounded-md text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Lista Scrolleable de Opciones con Muestra Tipográfica */}
                <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50">
                  {/* Fuentes Locales del Usuario */}
                  {filteredLocalFonts.length > 0 && (
                    <div className="pb-1 mb-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                        Fuentes Subidas en esta Sesión
                      </div>
                      {filteredLocalFonts.map((f) => (
                        <button
                          key={`local_${f}`}
                          type="button"
                          onClick={() => {
                            onSelectFont(f);
                            setIsFontSelectOpen(false);
                            setFontSearch('');
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            activeFontFamily === f
                              ? 'bg-violet-50 text-violet-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{f}</span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Subida
                            </span>
                          </div>
                          <span
                            className="text-sm font-semibold text-slate-700"
                            style={{ fontFamily: f }}
                          >
                            10 DORSAL
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fuentes Deportivas Incluidas */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Fuentes Deportivas Incluidas ({filteredPopularFonts.length})
                    </div>
                    {filteredPopularFonts.map((font) => {
                      const isSelected = activeFontFamily === font.family;
                      return (
                        <button
                          key={font.family}
                          type="button"
                          onClick={() => {
                            onSelectFont(font.family);
                            setIsFontSelectOpen(false);
                            setFontSearch('');
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-violet-600 text-white font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            <span className="truncate">{font.family}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                                isSelected
                                  ? 'bg-violet-700/50 text-violet-100 border-violet-500'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {font.category}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold shrink-0 tracking-wide ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                            style={{ fontFamily: font.family }}
                          >
                            {font.sampleText || '10 DORSAL'}
                          </span>
                        </button>
                      );
                    })}

                    {filteredPopularFonts.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No se encontraron fuentes con "{fontSearch}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fila 2: Selector de Color Deportivo y Ajuste de Tintas CMYK */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4.5 space-y-4">
            {/* Cabecera de Color: Swatches Rápidos + Hex */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                    style={{ backgroundColor: fillHex }}
                  />
                  Color de Relleno Vectorial:
                </span>

                {/* Input de Hexadecimal e Selector de Color con Popover Integrado */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
                  <input
                    type="color"
                    value={fillHex.startsWith('#') ? fillHex : `#${fillHex}`}
                    onChange={(e) => handleHexInputChange(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent p-0"
                    title="Abrir paleta de color"
                  />
                  <input
                    type="text"
                    value={fillHex}
                    onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
                    className="w-20 font-mono text-xs font-bold text-slate-800 bg-transparent focus:outline-none uppercase"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              {/* Presets Rápidos de Color Deportivo */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {PRESET_DORSAL_COLORS.map((preset) => {
                  const isSelected = fillHex.toUpperCase() === preset.hex.toUpperCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPresetColor(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50 text-violet-900 ring-2 ring-violet-500/20 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canales CMYK Dinámicos con Sliders y Porcentajes */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
                  <span>Calibración de Tintas para Sublimación (CMYK):</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Cobertura Total: <strong className={totalInkCoverage > 300 ? 'text-red-600' : 'text-slate-800'}>{totalInkCoverage}%</strong> (Máx. 300%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Canal C: Cian */}
                <div className="bg-white p-2.5 rounded-xl border border-cyan-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-600">C% (Cian)</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fillCmyk.c}
                        onChange={(e) => handleCmykChannelChange('c', Number(e.target.value))}
                        className="w-10 text-right font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fillCmyk.c}
                    onChange={(e) => handleCmykChannelChange('c', Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <button type="button" onClick={() => handleCmykChannelChange('c', 0)} className="hover:text-cyan-600 cursor-pointer">0%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('c', 50)} className="hover:text-cyan-600 cursor-pointer">50%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('c', 100)} className="hover:text-cyan-600 cursor-pointer">100%</button>
                  </div>
                </div>

                {/* Canal M: Magenta */}
                <div className="bg-white p-2.5 rounded-xl border border-pink-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-pink-600">M% (Magenta)</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fillCmyk.m}
                        onChange={(e) => handleCmykChannelChange('m', Number(e.target.value))}
                        className="w-10 text-right font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fillCmyk.m}
                    onChange={(e) => handleCmykChannelChange('m', Number(e.target.value))}
                    className="w-full accent-pink-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <button type="button" onClick={() => handleCmykChannelChange('m', 0)} className="hover:text-pink-600 cursor-pointer">0%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('m', 50)} className="hover:text-pink-600 cursor-pointer">50%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('m', 100)} className="hover:text-pink-600 cursor-pointer">100%</button>
                  </div>
                </div>

                {/* Canal Y: Amarillo */}
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-600">Y% (Amarillo)</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fillCmyk.y}
                        onChange={(e) => handleCmykChannelChange('y', Number(e.target.value))}
                        className="w-10 text-right font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fillCmyk.y}
                    onChange={(e) => handleCmykChannelChange('y', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <button type="button" onClick={() => handleCmykChannelChange('y', 0)} className="hover:text-amber-600 cursor-pointer">0%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('y', 50)} className="hover:text-amber-600 cursor-pointer">50%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('y', 100)} className="hover:text-amber-600 cursor-pointer">100%</button>
                  </div>
                </div>

                {/* Canal K: Negro */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-300 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">K% (Negro)</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fillCmyk.k}
                        onChange={(e) => handleCmykChannelChange('k', Number(e.target.value))}
                        className="w-10 text-right font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fillCmyk.k}
                    onChange={(e) => handleCmykChannelChange('k', Number(e.target.value))}
                    className="w-full accent-slate-800 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <button type="button" onClick={() => handleCmykChannelChange('k', 0)} className="hover:text-slate-800 cursor-pointer">0%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('k', 50)} className="hover:text-slate-800 cursor-pointer">50%</button>
                    <button type="button" onClick={() => handleCmykChannelChange('k', 100)} className="hover:text-slate-800 cursor-pointer">100%</button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                ✓ Vector 1:1 plano: Se genera sin duplicaciones de contorno para corte láser y Adobe Illustrator.
              </p>
            </div>
          </div>

          {/* Fila 3: Previsualización de Muestra en Vivo con Contraste Garantizado */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">Muestra en vivo:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={sampleName}
                    onChange={(e) => onSampleNameChange(e.target.value.toUpperCase())}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs w-32 uppercase text-center focus:outline-none shadow-2xs font-bold"
                    placeholder="NOMBRE"
                  />
                  <input
                    type="text"
                    value={sampleNumber}
                    onChange={(e) => onSampleNumberChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-violet-700 font-mono text-xs w-14 text-center font-bold focus:outline-none shadow-2xs"
                    placeholder="N°"
                  />
                </div>
              </div>

              {/* Selector de Fondo de Camiseta de Alta Legibilidad */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewBg === 'dark'
                      ? 'shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                  style={{
                    backgroundColor: previewBg === 'dark' ? '#0f172a' : 'transparent',
                    color: previewBg === 'dark' ? '#ffffff' : '#475569',
                  }}
                >
                  Fondo Oscuro
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewBg === 'light'
                      ? 'shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                  style={{
                    backgroundColor: previewBg === 'light' ? '#ffffff' : 'transparent',
                    color: previewBg === 'light' ? '#0f172a' : '#475569',
                    border: previewBg === 'light' ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  Fondo Claro
                </button>
              </div>
            </div>

            {/* Lienzo de Muestra con Estilo de Camiseta y Tipografía Activa */}
            <div
              className="w-full rounded-2xl p-6 sm:p-8 flex items-center justify-center min-h-[120px] shadow-inner transition-all border relative overflow-hidden"
              style={{
                backgroundColor: previewBg === 'dark' ? '#0f172a' : '#ffffff',
                borderColor: previewBg === 'dark' ? '#1e293b' : '#cbd5e1',
              }}
            >
              {/* Textura sutil deportiva de fondo */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    previewBg === 'dark'
                      ? 'radial-gradient(#ffffff 1px, transparent 1px)'
                      : 'radial-gradient(#000000 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              <div className="text-center flex items-center justify-center gap-4 sm:gap-6 flex-wrap select-none relative z-10">
                <span
                  className="font-bold tracking-wider uppercase leading-none drop-shadow-sm"
                  style={{
                    fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                    fontSize: '32px',
                    color: fillHex,
                  }}
                >
                  {sampleName || 'CHRISTOPHER'}
                </span>
                <span
                  className="font-bold tracking-tight leading-none drop-shadow-sm"
                  style={{
                    fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                    fontSize: '54px',
                    color: fillHex,
                  }}
                >
                  {sampleNumber || '9'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Listo, Aplicar Estilo</span>
          </button>
        </div>
      </div>

      {/* Sub-modal de Instrucciones para Google Fonts */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Info className="w-4 h-4 text-violet-600" />
                Cómo obtener fuentes deportivas
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4 leading-relaxed">
              <li>
                Entra a <strong className="text-slate-800">Google Fonts</strong> (fonts.google.com).
              </li>
              <li>
                Busca tipografías deportivas como <span className="font-mono font-bold text-violet-700">Bebas Neue</span>, <span className="font-mono font-bold text-violet-700">Oswald</span> o <span className="font-mono font-bold text-violet-700">Teko</span>.
              </li>
              <li>
                Haz clic en el botón <strong className="text-slate-800">"Get font"</strong> o <strong className="text-slate-800">"Download all"</strong> para bajar el archivo ZIP.
              </li>
              <li>
                Descomprime el ZIP y busca el archivo con extensión <span className="font-mono font-bold">.ttf</span> u <span className="font-mono font-bold">.otf</span>.
              </li>
              <li>
                En CimaTex, presiona el botón <strong className="text-violet-600">"Subir Fuente"</strong> y selecciona ese archivo para usarlo de inmediato en tus dorsales.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2 shadow-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
