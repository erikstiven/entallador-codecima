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
  SlidersHorizontal,
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

// 5 colores deportivos clave, concisos y esenciales
const ESSENTIAL_DORSAL_COLORS = [
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Negro', hex: '#000000' },
  { name: 'Dorado', hex: '#F59E0B' },
  { name: 'Amarillo', hex: '#FACC15' },
  { name: 'Rojo', hex: '#DC2626' },
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

  // Aplicar color de una sola vez ("de una") sin colisiones de estado asíncrono
  const handleApplyPresetColor = (preset: typeof ESSENTIAL_DORSAL_COLORS[0]) => {
    onFillHexChange(preset.hex);
    if (preset.hex === '#000000') {
      setPreviewBg('light');
    } else {
      setPreviewBg('dark');
    }
  };

  // Cambio bidireccional en canal CMYK -> recalcula HEX
  const handleCmykChannelChange = (channel: keyof CMYK, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    onFillCmykChange(channel, clamped);
  };

  // Cambio directo en HEX
  const handleHexInputChange = (hexVal: string) => {
    onFillHexChange(hexVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Configuración de Dorsal y Tipografía
              </h3>
              <p className="text-[11px] text-slate-500">
                Ajusta la fuente y el color vectorial para nombres y números de la espalda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Fila 1: Selector de Tipografía Dinámico y Conciso */}
          <div className="space-y-1.5 relative" ref={fontSelectRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-violet-600" />
                <span>Tipografía de Dorsal:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-[11px] text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                ¿Cómo descargar fuentes de Google?
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Trigger de Select 2 Dinámico */}
              <button
                type="button"
                onClick={() => setIsFontSelectOpen((prev) => !prev)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-xl px-3 py-2 text-left flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="font-bold text-xs text-slate-900 tracking-wide"
                    style={{ fontFamily: activeFontFamily }}
                  >
                    {activeFontFamily}
                  </span>
                  {activeFontObj && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200/80">
                      {activeFontObj.category}
                    </span>
                  )}
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
                className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap active:scale-95 shrink-0"
                title="Subir archivo .ttf, .otf o .font"
              >
                <UploadCloud className="w-3.5 h-3.5 text-white" />
                <span>Subir Fuente</span>
              </button>
            </div>

            {/* Panel Desplegable Flotante de Select 2 */}
            {isFontSelectOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col">
                {/* Buscador de Fuentes */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Buscar fuente (ej. Bebas, Teko, Oswald)..."
                    className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none py-0.5"
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

                {/* Lista Scrolleable Concisa */}
                <div className="max-h-52 overflow-y-auto p-1 divide-y divide-slate-50">
                  {/* Fuentes Locales del Usuario */}
                  {filteredLocalFonts.length > 0 && (
                    <div className="pb-1 mb-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                        Fuentes Subidas
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
                          <span className="font-bold text-xs" style={{ fontFamily: f }}>
                            {f}
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                            Local
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fuentes Deportivas Incluidas */}
                  <div>
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
                            <span
                              className={`text-sm font-bold tracking-wide ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                              style={{ fontFamily: font.family }}
                            >
                              {font.family}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                              isSelected
                                ? 'bg-violet-700/50 text-violet-100 border-violet-500'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {font.category}
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

          {/* Fila 2: Selector de Color Conciso (Pocas Opciones Clave + Hex) */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: fillHex }}
                />
                Color de Relleno Vectorial:
              </span>

              {/* Selector de color Hex */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                <input
                  type="color"
                  value={fillHex.startsWith('#') ? fillHex : `#${fillHex}`}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={fillHex}
                  onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
                  className="w-16 font-mono text-xs font-bold text-slate-800 bg-transparent focus:outline-none uppercase"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Pocas Opciones y Claras (5 Colores Clave Deportivos) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {ESSENTIAL_DORSAL_COLORS.map((preset) => {
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
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Canales CMYK Compactos (Sin Desbordar Pantalla) */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-violet-600" />
                  <span>Tintas CMYK para Sublimación:</span>
                </span>
                <span className="font-mono text-slate-400 font-normal">
                  Total: {(fillCmyk.c || 0) + (fillCmyk.m || 0) + (fillCmyk.y || 0) + (fillCmyk.k || 0)}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* Canal C */}
                <div className="bg-white p-2 rounded-lg border border-cyan-200 shadow-2xs text-center">
                  <span className="text-[10px] font-bold text-cyan-600 block mb-0.5">Cian (C)</span>
                  <div className="flex items-center justify-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={fillCmyk.c}
                      onChange={(e) => handleCmykChannelChange('c', Number(e.target.value))}
                      className="w-10 text-center font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Canal M */}
                <div className="bg-white p-2 rounded-lg border border-pink-200 shadow-2xs text-center">
                  <span className="text-[10px] font-bold text-pink-600 block mb-0.5">Magenta (M)</span>
                  <div className="flex items-center justify-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={fillCmyk.m}
                      onChange={(e) => handleCmykChannelChange('m', Number(e.target.value))}
                      className="w-10 text-center font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Canal Y */}
                <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs text-center">
                  <span className="text-[10px] font-bold text-amber-600 block mb-0.5">Amarillo (Y)</span>
                  <div className="flex items-center justify-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={fillCmyk.y}
                      onChange={(e) => handleCmykChannelChange('y', Number(e.target.value))}
                      className="w-10 text-center font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Canal K */}
                <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-2xs text-center">
                  <span className="text-[10px] font-bold text-slate-700 block mb-0.5">Negro (K)</span>
                  <div className="flex items-center justify-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={fillCmyk.k}
                      onChange={(e) => handleCmykChannelChange('k', Number(e.target.value))}
                      className="w-10 text-center font-mono font-bold text-slate-900 text-xs bg-slate-50 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fila 3: Previsualización de Muestra en Vivo Compacta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">Muestra en vivo:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={sampleName}
                    onChange={(e) => onSampleNameChange(e.target.value.toUpperCase())}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-900 font-mono text-xs w-28 uppercase text-center focus:outline-none shadow-2xs font-bold"
                    placeholder="NOMBRE"
                  />
                  <input
                    type="text"
                    value={sampleNumber}
                    onChange={(e) => onSampleNumberChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-violet-700 font-mono text-xs w-12 text-center font-bold focus:outline-none shadow-2xs"
                    placeholder="N°"
                  />
                </div>
              </div>

              {/* Selector de Fondo de Camiseta de Alta Legibilidad */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
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
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
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

            {/* Lienzo de Muestra sin Desbordamiento */}
            <div
              className="w-full rounded-xl p-4 flex items-center justify-center min-h-[90px] shadow-inner transition-all border relative overflow-hidden"
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

              <div className="text-center flex items-center justify-center gap-4 flex-wrap select-none relative z-10">
                <span
                  className="font-bold tracking-wider uppercase leading-none drop-shadow-sm"
                  style={{
                    fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                    fontSize: '28px',
                    color: fillHex,
                  }}
                >
                  {sampleName || 'CHRISTOPHER'}
                </span>
                <span
                  className="font-bold tracking-tight leading-none drop-shadow-sm"
                  style={{
                    fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                    fontSize: '48px',
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
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Listo, Aplicar Estilo</span>
          </button>
        </div>
      </div>

      {/* Sub-modal de Instrucciones para Google Fonts */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
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

            <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4 leading-relaxed">
              <li>
                Entra a <strong className="text-slate-800">Google Fonts</strong> (fonts.google.com).
              </li>
              <li>
                Busca tipografías como <span className="font-mono font-bold text-violet-700">Bebas Neue</span>, <span className="font-mono font-bold text-violet-700">Oswald</span> o <span className="font-mono font-bold text-violet-700">Teko</span>.
              </li>
              <li>
                Descarga el archivo ZIP y descomprímelo para obtener el archivo <span className="font-mono font-bold">.ttf</span> u <span className="font-mono font-bold">.otf</span>.
              </li>
              <li>
                Pulsa <strong className="text-violet-600">"Subir Fuente"</strong> y selecciona ese archivo.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mt-1 shadow-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
