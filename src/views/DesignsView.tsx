import React, { useEffect, useState, useRef } from 'react';
import { 
  Palette, 
  Trash2, 
  Type, 
  UploadCloud, 
  Pencil, 
  Check, 
  X,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useDesignStore } from '@/modules/designs/designStore';
import { PieceType } from '@/core/geometry/types';
import { POPULAR_SPORTS_FONTS, loadGoogleFont, getLocalSystemFonts, loadCustomFontFromFile } from '@/core/fonts/googleFonts';
import { cmykToHex, hexToCmyk, CMYK } from '@/core/color/cmykColor';

function cleanSvgForDisplay(svgContent?: string): string {
  if (!svgContent) return '';
  let content = svgContent.trim();
  if (!content.includes('<svg')) return content;

  // 1. Extraer o asegurar viewBox si no tiene
  const hasViewBox = /viewBox\s*=\s*["'][^"']+["']/i.test(content);
  let viewBoxAttr = '';
  if (!hasViewBox) {
    const widthMatch = content.match(/\bwidth\s*=\s*["']?([\d.]+)/i);
    const heightMatch = content.match(/\bheight\s*=\s*["']?([\d.]+)/i);
    if (widthMatch && heightMatch) {
      viewBoxAttr = `viewBox="0 0 ${widthMatch[1]} ${heightMatch[1]}"`;
    } else {
      viewBoxAttr = 'viewBox="0 0 500 700"';
    }
  }

  // 2. Normalizar la etiqueta <svg> para llenar el 100% de la ranura visual
  content = content.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
    const cleanAttrs = attrs
      .replace(/\bwidth\s*=\s*["'][^"']+["']/gi, '')
      .replace(/\bheight\s*=\s*["'][^"']+["']/gi, '')
      .replace(/\bstyle\s*=\s*["'][^"']+["']/gi, '')
      .replace(/\bpreserveAspectRatio\s*=\s*["'][^"']+["']/gi, '');

    return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; display: block;" ${viewBoxAttr} ${cleanAttrs}>`;
  });

  return content;
}

export const DesignsView: React.FC = () => {
  const frenteInputRef = useRef<HTMLInputElement>(null);
  const espaldaInputRef = useRef<HTMLInputElement>(null);
  const mangaIzqInputRef = useRef<HTMLInputElement>(null);
  const mangaDerInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const {
    designs,
    activeDesign,
    loadDesignsFromDatabase,
    createNewDesign,
    setPieceArtwork,
    removePieceArtwork,
    importMultiBlockFiles,
    setActiveDesign,
    deleteDesign,
    clearAllDesigns,
    updatePlaceholderRule,
    updateDesignName,
  } = useDesignStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Tipografía seleccionada
  const [activeFontFamily, setActiveFontFamily] = useState<string>('Bebas Neue');
  const [isCustomFont, setIsCustomFont] = useState(false);
  const [customFontInput, setCustomFontInput] = useState('');
  const [localFonts, setLocalFonts] = useState<string[]>([]);
  const [isSyncingFonts, setIsSyncingFonts] = useState<boolean>(false);

  const handleSyncLocalFonts = async () => {
    setIsSyncingFonts(true);
    try {
      const fonts = await getLocalSystemFonts();
      if (fonts.length > 0) {
        setLocalFonts(fonts);
      } else {
        // Si el navegador no permite acceso directo a la lista, abrir diálogo de archivo TTF/OTF
        fontFileInputRef.current?.click();
      }
    } catch (err) {
      console.warn('Error al sincronizar fuentes:', err);
      fontFileInputRef.current?.click();
    } finally {
      setIsSyncingFonts(false);
    }
  };

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fontName = await loadCustomFontFromFile(file);
      setLocalFonts((prev) => Array.from(new Set([fontName, ...prev])));
      setActiveFontFamily(fontName);
      setIsCustomFont(false);
      applyStyleUpdates({ fontFamily: fontName });
    } catch (err) {
      console.error('Error al cargar archivo de fuente:', err);
    }
  };

  // Colores CMYK de Relleno (Fill)
  const [fillHex, setFillHex] = useState<string>('#FFFFFF');
  const [fillCmyk, setFillCmyk] = useState<CMYK>({ c: 0, m: 0, y: 0, k: 0 });

  // Colores CMYK de Contorno / Borde (Stroke)
  const [hasStroke, setHasStroke] = useState<boolean>(true);
  const [strokeHex, setStrokeHex] = useState<string>('#000000');
  const [strokeCmyk, setStrokeCmyk] = useState<CMYK>({ c: 0, m: 0, y: 0, k: 100 });
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);

  // Muestra de prueba para el dorsal
  const [sampleName, setSampleName] = useState<string>('CHRISTOPHER');
  const [sampleNumber, setSampleNumber] = useState<string>('9');

  useEffect(() => {
    loadDesignsFromDatabase();
  }, []);

  // Sincronizar reglas del diseño activo
  useEffect(() => {
    if (activeDesign) {
      const espaldaArt = activeDesign.pieceArtworks['ESPALDA'];
      const nameR = espaldaArt?.placeholders.find((p) => p.id === 'NOMBRE');
      const numR = espaldaArt?.placeholders.find((p) => p.id.includes('NUMERO'));
      const activeRule = nameR || numR;

      if (activeRule) {
        if (activeRule.fontFamily) {
          setActiveFontFamily(activeRule.fontFamily);
          loadGoogleFont(activeRule.fontFamily);
        }
        if (activeRule.fillColor) {
          setFillHex(activeRule.fillColor);
          setFillCmyk(hexToCmyk(activeRule.fillColor));
        }
        if (activeRule.strokeColor) {
          setStrokeHex(activeRule.strokeColor);
          setStrokeCmyk(hexToCmyk(activeRule.strokeColor));
          setHasStroke(Boolean((activeRule.strokeWidthMm || 0) > 0));
        }
        if (activeRule.strokeWidthMm !== undefined) {
          setStrokeWidth(activeRule.strokeWidthMm);
        }
      }
    }
  }, [activeDesign?.id]);

  const applyStyleUpdates = (updates: {
    fontFamily?: string;
    fillColor?: string;
    strokeColor?: string;
    strokeWidthMm?: number;
  }) => {
    if (!activeDesign) return;
    updatePlaceholderRule(activeDesign.id, 'ESPALDA', 'NOMBRE', updates);
    updatePlaceholderRule(activeDesign.id, 'ESPALDA', 'NUMERO_ESPALDA', updates);
    if (activeDesign.pieceArtworks['DELANTERO']) {
      updatePlaceholderRule(activeDesign.id, 'DELANTERO', 'NUMERO_DELANTERO', updates);
    }
  };

  const handleSelectFont = (fontFamily: string) => {
    setActiveFontFamily(fontFamily);
    setIsCustomFont(false);
    loadGoogleFont(fontFamily);
    applyStyleUpdates({ fontFamily });
  };

  const handleApplyCustomFont = () => {
    const clean = customFontInput.trim();
    if (!clean) return;
    setActiveFontFamily(clean);
    loadGoogleFont(clean);
    applyStyleUpdates({ fontFamily: clean });
  };

  const handleFillCmykChange = (channel: keyof CMYK, val: number) => {
    const safeVal = Math.max(0, Math.min(100, Math.round(Number(val) || 0)));
    const newCmyk = { ...fillCmyk, [channel]: safeVal };
    setFillCmyk(newCmyk);
    const hex = cmykToHex(newCmyk);
    setFillHex(hex);
    applyStyleUpdates({ fillColor: hex });
  };

  const handleFillHexChange = (hex: string) => {
    setFillHex(hex);
    const cmyk = hexToCmyk(hex);
    setFillCmyk(cmyk);
    applyStyleUpdates({ fillColor: hex });
  };

  const handleStrokeCmykChange = (channel: keyof CMYK, val: number) => {
    const safeVal = Math.max(0, Math.min(100, Math.round(Number(val) || 0)));
    const newCmyk = { ...strokeCmyk, [channel]: safeVal };
    setStrokeCmyk(newCmyk);
    const hex = cmykToHex(newCmyk);
    setStrokeHex(hex);
    if (hasStroke) {
      applyStyleUpdates({ strokeColor: hex });
    }
  };

  const handleStrokeHexChange = (hex: string) => {
    setStrokeHex(hex);
    const cmyk = hexToCmyk(hex);
    setStrokeCmyk(cmyk);
    if (hasStroke) {
      applyStyleUpdates({ strokeColor: hex });
    }
  };

  const handleToggleStroke = (enabled: boolean) => {
    setHasStroke(enabled);
    if (enabled) {
      applyStyleUpdates({ strokeColor: strokeHex, strokeWidthMm: strokeWidth || 2.5 });
    } else {
      applyStyleUpdates({ strokeWidthMm: 0 });
    }
  };

  const handleStrokeWidthChange = (widthMm: number) => {
    const safe = Math.max(0, Number(widthMm) || 0);
    setStrokeWidth(safe);
    if (hasStroke) {
      applyStyleUpdates({ strokeWidthMm: safe });
    }
  };

  // Carga de archivo individual por ranura
  const handleUploadSingleBlock = (pieceType: PieceType, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setPieceArtwork(pieceType, content);
      }
    };
    reader.readAsText(file);
  };

  // Carga masiva de múltiples archivos juntos
  const handleUploadMultipleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const readFiles: { name: string; content: string }[] = [];
    let completed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          readFiles.push({ name: file.name, content });
        }
        completed++;
        if (completed === files.length) {
          importMultiBlockFiles(readFiles);
        }
      };
      reader.readAsText(file);
    });
  };

  const frenteArt = activeDesign?.pieceArtworks['DELANTERO'];
  const espaldaArt = activeDesign?.pieceArtworks['ESPALDA'];
  const mangaIzqArt = activeDesign?.pieceArtworks['MANGA_IZQ'];
  const mangaDerArt = activeDesign?.pieceArtworks['MANGA_DER'];

  const handleCopyMangaIzqToDer = () => {
    if (!activeDesign || !mangaIzqArt) return;
    setPieceArtwork('MANGA_DER', mangaIzqArt.svgArtContent);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Inputs ocultos de carga */}
      <input
        ref={frenteInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('DELANTERO', e.target.files?.[0])}
      />
      <input
        ref={espaldaInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('ESPALDA', e.target.files?.[0])}
      />
      <input
        ref={mangaIzqInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('MANGA_IZQ', e.target.files?.[0])}
      />
      <input
        ref={mangaDerInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('MANGA_DER', e.target.files?.[0])}
      />
      <input
        ref={multiInputRef}
        type="file"
        accept=".svg"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUploadMultipleFiles(e.target.files)}
      />

      {/* Grilla Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Columna Izquierda: Modelos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Modelos ({designs.length})
            </h3>
            <button
              onClick={() => createNewDesign()}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              title="Crear nuevo modelo"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>

          <div className="space-y-2">
            {designs.map((d) => {
              const isSelected = activeDesign?.id === d.id;
              const hasFrente = Boolean(d.pieceArtworks['DELANTERO']);
              const hasEspalda = Boolean(d.pieceArtworks['ESPALDA']);
              const hasMangaIzq = Boolean(d.pieceArtworks['MANGA_IZQ']);
              const hasMangaDer = Boolean(d.pieceArtworks['MANGA_DER']);
              const blocksReady = [hasFrente, hasEspalda, hasMangaIzq, hasMangaDer].filter(Boolean).length;
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveDesign(d)}
                  className={`bg-slate-900/90 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:border-slate-600 ${
                    isSelected
                      ? 'border-emerald-500 shadow-lg shadow-emerald-950/50 bg-slate-850 ring-1 ring-emerald-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{d.name}</span>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-lg ${
                      blocksReady >= 3 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {blocksReady === 4 ? 'Listo (4/4)' : `${blocksReady}/4 bloques`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {designs.length > 0 && (
            <button
              onClick={clearAllDesigns}
              className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg text-xs font-medium border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar todos
            </button>
          )}
        </div>

        {/* Columna Derecha: Configuración y Ranuras de Bloques */}
        {activeDesign ? (
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              {/* Título editable del modelo */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateDesignName(activeDesign.id, editedName);
                            setIsEditingName(false);
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                          }
                        }}
                        className="bg-slate-950 border border-emerald-500 rounded px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          updateDesignName(activeDesign.id, editedName);
                          setIsEditingName(false);
                        }}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{activeDesign.name}</h3>
                      <button
                        onClick={() => {
                          setEditedName(activeDesign.name);
                          setIsEditingName(true);
                        }}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                        title="Renombrar este modelo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ml-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Guardado automático
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => multiInputRef.current?.click()}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Subir bloques del modelo (SVG)
                  </button>
                  <button
                    onClick={() => deleteDesign(activeDesign.id)}
                    className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    title="Eliminar este modelo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barra de Estilo del Dorsal (Google Fonts + CMYK + Muestra) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Tipografía */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-emerald-400" />
                        Tipografía de Dorsal:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          ref={fontFileInputRef}
                          onChange={handleFontFileUpload}
                          accept=".ttf,.otf,.woff,.woff2"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={handleSyncLocalFonts}
                          disabled={isSyncingFonts}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          title="Detectar fuentes instaladas en Windows o cargar archivo .TTF/.OTF"
                        >
                          <span>{isSyncingFonts ? 'Detectando...' : '🔄 Sincronizar PC / TTF'}</span>
                        </button>
                      </div>
                    </div>

                    <select
                      value={isCustomFont ? 'CUSTOM' : activeFontFamily}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomFont(true);
                        } else {
                          handleSelectFont(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {localFonts.length > 0 && (
                        <optgroup label="✨ Fuentes de tu PC (Instaladas)">
                          {localFonts.map((f) => (
                            <option key={`local_${f}`} value={f}>
                              {f} (Local)
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="🏆 Fuentes Deportivas (Mundiales y Ligas)">
                        {POPULAR_SPORTS_FONTS.map((f) => (
                          <option key={f.family} value={f.family}>
                            {f.family} ({f.category})
                          </option>
                        ))}
                      </optgroup>
                      <option value="CUSTOM">➕ Escribir nombre exacto de fuente instalada...</option>
                    </select>

                    {isCustomFont && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          type="text"
                          value={customFontInput}
                          onChange={(e) => setCustomFontInput(e.target.value)}
                          placeholder="Ej: AdiCup Q 2022, Jersey M54..."
                          className="flex-1 bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-white text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCustomFont}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Relleno CMYK */}
                  <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: fillHex }} />
                        Relleno:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={fillHex}
                          onChange={(e) => handleFillHexChange(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-slate-400">{fillHex}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-cyan-400 block font-bold">C%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={fillCmyk.c}
                          onChange={(e) => handleFillCmykChange('c', Number(e.target.value))}
                          className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-pink-400 block font-bold">M%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={fillCmyk.m}
                          onChange={(e) => handleFillCmykChange('m', Number(e.target.value))}
                          className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-yellow-400 block font-bold">Y%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={fillCmyk.y}
                          onChange={(e) => handleFillCmykChange('y', Number(e.target.value))}
                          className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-300 block font-bold">K%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={fillCmyk.k}
                          onChange={(e) => handleFillCmykChange('k', Number(e.target.value))}
                          className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Borde / Filete CMYK */}
                  <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasStroke}
                          onChange={(e) => handleToggleStroke(e.target.checked)}
                          className="rounded border-slate-700 text-emerald-600 w-3 h-3"
                        />
                        <span className="text-slate-200 font-semibold flex items-center gap-1">
                          {hasStroke && (
                            <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: strokeHex }} />
                          )}
                          Borde / Filete:
                        </span>
                      </label>
                      {hasStroke && (
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={strokeHex}
                            onChange={(e) => handleStrokeHexChange(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-slate-400">{strokeHex}</span>
                        </div>
                      )}
                    </div>

                    {hasStroke ? (
                      <>
                        <div className="grid grid-cols-4 gap-1">
                          <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                            <span className="text-[9px] font-mono text-cyan-400 block font-bold">C%</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={strokeCmyk.c}
                              onChange={(e) => handleStrokeCmykChange('c', Number(e.target.value))}
                              className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                            <span className="text-[9px] font-mono text-pink-400 block font-bold">M%</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={strokeCmyk.m}
                              onChange={(e) => handleStrokeCmykChange('m', Number(e.target.value))}
                              className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                            <span className="text-[9px] font-mono text-yellow-400 block font-bold">Y%</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={strokeCmyk.y}
                              onChange={(e) => handleStrokeCmykChange('y', Number(e.target.value))}
                              className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div className="bg-slate-950 p-1 rounded border border-slate-800 text-center">
                            <span className="text-[9px] font-mono text-slate-300 block font-bold">K%</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={strokeCmyk.k}
                              onChange={(e) => handleStrokeCmykChange('k', Number(e.target.value))}
                              className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>Grosor:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="range"
                              min="0.5"
                              max="6.0"
                              step="0.5"
                              value={strokeWidth}
                              onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                              className="w-16 accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-mono font-bold text-white">{strokeWidth.toFixed(1)} mm</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic py-2 text-center">
                        Sin borde exterior
                      </div>
                    )}
                  </div>
                </div>

                {/* Muestra en vivo del dorsal */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Muestra:</span>
                    <input
                      type="text"
                      value={sampleName}
                      onChange={(e) => setSampleName(e.target.value.toUpperCase())}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white font-mono text-xs w-28 focus:outline-none"
                      placeholder="NOMBRE"
                    />
                    <input
                      type="text"
                      value={sampleNumber}
                      onChange={(e) => setSampleNumber(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-mono text-xs w-14 text-center focus:border-emerald-500 focus:outline-none font-bold"
                      placeholder="N°"
                    />
                  </div>

                  {/* Banner de previsualización tipográfica grande y legible */}
                  <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-center min-h-[65px] overflow-hidden">
                    <div className="text-center flex items-center justify-center gap-4 flex-wrap">
                      <span
                        className="font-bold tracking-wider uppercase leading-none transition-all"
                        style={{
                          fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                          fontSize: '28px',
                          color: fillHex,
                          WebkitTextStroke: hasStroke ? `${Math.max(0.8, strokeWidth * 0.5)}px ${strokeHex}` : 'none',
                          paintOrder: 'stroke fill',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                        }}
                      >
                        {sampleName || 'CHRISTOPHER'}
                      </span>
                      <span
                        className="font-bold tracking-tight leading-none transition-all"
                        style={{
                          fontFamily: `'${activeFontFamily}', Impact, 'Arial Narrow', sans-serif`,
                          fontSize: '44px',
                          color: fillHex,
                          WebkitTextStroke: hasStroke ? `${Math.max(1.2, strokeWidth * 0.7)}px ${strokeHex}` : 'none',
                          paintOrder: 'stroke fill',
                          textShadow: '0 3px 10px rgba(0,0,0,0.9)',
                        }}
                      >
                        {sampleNumber || '9'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LAS 4 RANURAS DE BLOQUES DE ARTE: FRENTE, ESPALDA, MANGA IZQ, MANGA DER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* RANURA 1: FRENTE */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">🎽 Bloque Frente</span>
                    {frenteArt ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Cargado
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  <div 
                    onClick={() => frenteInputRef.current?.click()}
                    className={`w-full h-52 rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all ${
                      frenteArt
                        ? 'border-slate-700 bg-slate-900/80 hover:border-emerald-500'
                        : 'border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    {frenteArt?.svgArtContent ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: cleanSvgForDisplay(frenteArt.svgArtContent) }}
                      />
                    ) : (
                      <div className="text-center space-y-1.5">
                        <UploadCloud className="w-7 h-7 text-slate-600 mx-auto" />
                        <span className="text-xs font-semibold text-slate-300 block">Cargar Frente.svg</span>
                      </div>
                    )}
                  </div>

                  {frenteArt && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => frenteInputRef.current?.click()}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={() => removePieceArtwork('DELANTERO')}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

                {/* RANURA 2: ESPALDA */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">👕 Bloque Espalda</span>
                    {espaldaArt ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Cargado
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  <div 
                    onClick={() => espaldaInputRef.current?.click()}
                    className={`w-full h-52 rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all ${
                      espaldaArt
                        ? 'border-slate-700 bg-slate-900/80 hover:border-emerald-500'
                        : 'border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    {espaldaArt?.svgArtContent ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: cleanSvgForDisplay(espaldaArt.svgArtContent) }}
                      />
                    ) : (
                      <div className="text-center space-y-1.5">
                        <UploadCloud className="w-7 h-7 text-slate-600 mx-auto" />
                        <span className="text-xs font-semibold text-slate-300 block">Cargar Espalda.svg</span>
                      </div>
                    )}
                  </div>

                  {espaldaArt && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => espaldaInputRef.current?.click()}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={() => removePieceArtwork('ESPALDA')}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

                {/* RANURA 3: MANGA IZQUIERDA */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">🦾 Manga Izquierda</span>
                    {mangaIzqArt ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Cargada
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  <div 
                    onClick={() => mangaIzqInputRef.current?.click()}
                    className={`w-full h-52 rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all ${
                      mangaIzqArt
                        ? 'border-slate-700 bg-slate-900/80 hover:border-emerald-500'
                        : 'border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    {mangaIzqArt?.svgArtContent ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: cleanSvgForDisplay(mangaIzqArt.svgArtContent) }}
                      />
                    ) : (
                      <div className="text-center space-y-1.5">
                        <UploadCloud className="w-7 h-7 text-slate-600 mx-auto" />
                        <span className="text-xs font-semibold text-slate-300 block">Cargar Manga Izq.svg</span>
                      </div>
                    )}
                  </div>

                  {mangaIzqArt && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => mangaIzqInputRef.current?.click()}
                        className="text-slate-400 hover:text-white"
                      >
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={() => removePieceArtwork('MANGA_IZQ')}
                        className="text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

                {/* RANURA 4: MANGA DERECHA */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">🦾 Manga Derecha</span>
                    {mangaDerArt ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Cargada
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  <div 
                    onClick={() => mangaDerInputRef.current?.click()}
                    className={`w-full h-52 rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all ${
                      mangaDerArt
                        ? 'border-slate-700 bg-slate-900/80 hover:border-emerald-500'
                        : 'border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    {mangaDerArt?.svgArtContent ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: cleanSvgForDisplay(mangaDerArt.svgArtContent) }}
                      />
                    ) : (
                      <div className="text-center space-y-1.5 p-1">
                        <UploadCloud className="w-7 h-7 text-slate-600 mx-auto" />
                        <span className="text-xs font-semibold text-slate-300 block">Cargar Manga Der.svg</span>
                        {mangaIzqArt && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyMangaIzqToDer();
                            }}
                            className="mt-1 px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded text-[11px] font-medium shadow-sm transition-colors"
                          >
                            🔄 Copiar de Manga Izq
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {mangaDerArt && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => mangaDerInputRef.current?.click()}
                        className="text-slate-400 hover:text-white"
                      >
                        Reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={() => removePieceArtwork('MANGA_DER')}
                        className="text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
            <Palette className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Selecciona o crea un modelo de diseño</h3>
            <button
              onClick={() => createNewDesign()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
            >
              Crear Nuevo Modelo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
