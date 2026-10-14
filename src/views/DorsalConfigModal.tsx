import React, { useState, useRef } from 'react';
import { X, Type, UploadCloud, Info, Check, HelpCircle } from 'lucide-react';
import { POPULAR_SPORTS_FONTS } from '@/core/fonts/googleFonts';
import { CMYK } from '@/core/color/cmykColor';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Fila 1: Tipografía y Subida */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-violet-600" />
                Tipografía de Dorsal:
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
              <select
                value={activeFontFamily}
                onChange={(e) => onSelectFont(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-violet-500 cursor-pointer text-xs"
              >
                {localFonts.length > 0 && (
                  <optgroup label="Fuentes cargadas en esta sesión">
                    {localFonts.map((f) => (
                      <option key={`local_${f}`} value={f}>
                        {f} (Local)
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="Fuentes incluidas en CimaTex">
                  {POPULAR_SPORTS_FONTS.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.family} ({f.category})
                    </option>
                  ))}
                </optgroup>
              </select>

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
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                title="Subir archivo .ttf, .otf o .font"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Subir Fuente</span>
              </button>
            </div>
          </div>

          {/* Fila 2: Relleno Vectorial CMYK y HEX */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: fillHex }}
                />
                Color de Relleno Vectorial:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={fillHex}
                  onChange={(e) => onFillHexChange(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-xs font-bold text-slate-700">{fillHex}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-cyan-600 block font-bold">C% (Cian)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fillCmyk.c}
                  onChange={(e) => onFillCmykChange('c', Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-hidden"
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-pink-600 block font-bold">M% (Magenta)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fillCmyk.m}
                  onChange={(e) => onFillCmykChange('m', Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-hidden"
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-amber-600 block font-bold">Y% (Amarillo)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fillCmyk.y}
                  onChange={(e) => onFillCmykChange('y', Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-hidden"
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] font-mono text-slate-700 block font-bold">K% (Negro)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fillCmyk.k}
                  onChange={(e) => onFillCmykChange('k', Number(e.target.value))}
                  className="w-full bg-transparent text-center font-mono font-bold text-slate-900 text-xs focus:outline-hidden"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              ✓ Exportación limpia: los números se generan con trazado plano único sin duplicaciones de contorno para compatibilidad total con corte láser e Illustrator.
            </p>
          </div>

          {/* Fila 3: Previsualización de Muestra */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Muestra en vivo:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sampleName}
                  onChange={(e) => onSampleNameChange(e.target.value.toUpperCase())}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-mono text-xs w-28 uppercase text-center focus:outline-hidden"
                  placeholder="NOMBRE"
                />
                <input
                  type="text"
                  value={sampleNumber}
                  onChange={(e) => onSampleNumberChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-violet-700 font-mono text-xs w-12 text-center font-bold focus:outline-hidden"
                  placeholder="N°"
                />
              </div>
            </div>

            <div className="w-full bg-slate-900 rounded-xl p-6 flex items-center justify-center min-h-[90px] shadow-inner">
              <div className="text-center flex items-center justify-center gap-4 flex-wrap select-none">
                <span
                  className="font-bold tracking-wider uppercase leading-none"
                  style={{
                    fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                    fontSize: '26px',
                    color: fillHex,
                  }}
                >
                  {sampleName || 'NOMBRE'}
                </span>
                <span
                  className="font-bold tracking-tight leading-none"
                  style={{
                    fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                    fontSize: '44px',
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
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Listo, Aplicar Estilo</span>
          </button>
        </div>
      </div>

      {/* Sub-modal de Instrucciones para Google Fonts */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Info className="w-4 h-4 text-violet-600" />
                Cómo obtener fuentes deportivas
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4 leading-relaxed">
              <li>
                Entra a <strong className="text-slate-800">Google Fonts</strong> (fonts.google.com).
              </li>
              <li>
                Busca tipografías deportivas o condensadas como <span className="font-mono font-bold text-violet-700">Bebas Neue</span>, <span className="font-mono font-bold text-violet-700">Oswald</span> o <span className="font-mono font-bold text-violet-700">Teko</span>.
              </li>
              <li>
                Haz clic en el botón <strong className="text-slate-800">"Get font"</strong> o <strong className="text-slate-800">"Download all"</strong> para bajar el archivo ZIP.
              </li>
              <li>
                Descomprime el ZIP en tu equipo y busca el archivo con extensión <span className="font-mono font-bold">.ttf</span> o <span className="font-mono font-bold">.otf</span>.
              </li>
              <li>
                En CimaTex, presiona el botón <strong className="text-violet-600">"Subir Fuente"</strong> y selecciona ese archivo para usarlo de inmediato en tus dorsales.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
