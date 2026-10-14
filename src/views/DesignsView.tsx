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
  AlertCircle,
  Shirt,
  Scissors,
  Layers,
  Copy,
  Save,
  Loader2
} from 'lucide-react';
import { useDesignStore } from '@/modules/designs/designStore';
import { dbService } from '@/core/database/db';
import { PieceType } from '@/core/geometry/types';
import { POPULAR_SPORTS_FONTS, loadGoogleFont, loadCustomFontFromFile } from '@/core/fonts/googleFonts';
import { getAllStoredCustomFonts } from '@/core/fonts/fontRepository';
import { cmykToHex, hexToCmyk, CMYK } from '@/core/color/cmykColor';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { SvgTextilePreview, TextilePieceCarousel } from '@/components/textile';
import { showAlert } from '@/core/ui/alerts';
import { DorsalConfigModal } from './DorsalConfigModal';

// Siluetas Vectoriales Guía de Alta Definición para las Ranuras de Arte
const SilhouetteJerseyRound: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M35 16 C42 25 58 25 65 16 L84 25 L75 40 L68 35 L68 86 L32 86 L32 35 L25 40 L16 25 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35 16 C42 25 58 25 65 16" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="50" cy="42" r="3" fill="currentColor" opacity="0.4" />
  </svg>
);

const SilhouetteJerseyBack: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M36 16 C44 20 56 20 64 16 L84 25 L75 40 L68 35 L68 86 L32 86 L32 35 L25 40 L16 25 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M42 38 L58 38 M50 48 L50 74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const SilhouetteSleeveLeft: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22 28 C36 18 64 18 78 28 L68 80 L32 80 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 72 L68 72" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);

const SilhouetteSleeveRight: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M78 28 C64 18 36 18 22 28 L32 80 L68 80 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 72 L68 72" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);

const SilhouetteShort: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M24 22 L76 22 L72 82 L48 82 L50 46 L52 82 L28 82 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 30 L76 30" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);

export const DesignsView: React.FC = () => {
  const multiInputRef = useRef<HTMLInputElement>(null);

  const {
    designs,
    activeDesign,
    loadDesignsFromDatabase,
    createNewDesign,
    setPieceArtwork,
    removePieceArtwork,
    importMultiBlockFiles,
    setActiveDesign,
    saveActiveDesign,
    deleteDesign,
    clearAllDesigns,
    updatePlaceholderRule,
    updateDesignName,
  } = useDesignStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleExplicitSaveDesign = async () => {
    if (!activeDesign || saveStatus === 'SAVING' || isUploading) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setSaveStatus('SAVING');
    try {
      const [saved] = await Promise.all([
        saveActiveDesign(),
        dbService.persistBrowserDb(),
        new Promise((resolve) => window.setTimeout(resolve, 250)),
      ]);
      await dbService.persistBrowserDb();

      if (useGeneratorStore.getState().generatedPieces.length > 0) {
        useGeneratorStore.getState().generatePieces();
        useNestingStore.getState().clearNesting();
      }

      if (!saved) {
        setSaveStatus('IDLE');
        showAlert.error('Error al Guardar', 'No fue posible guardar el diseño en la base de datos.');
        return;
      }

      const now = new Date();
      const formattedTime = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setLastSavedAt(`Guardado a las ${formattedTime}`);
      setSaveStatus('SAVED');
      showAlert.toast('success', `Diseño "${activeDesign.name}" guardado correctamente`);

      saveTimerRef.current = window.setTimeout(() => {
        setSaveStatus('IDLE');
        saveTimerRef.current = null;
      }, 3000);
    } catch (err) {
      console.error('Error guardando diseño explícitamente:', err);
      setSaveStatus('IDLE');
      showAlert.error('Error al Guardar', 'No fue posible guardar el diseño en la base de datos.');
    }
  };

  // Tipografía seleccionada y modal
  const [activeFontFamily, setActiveFontFamily] = useState<string>('Bebas Neue');
  const [localFonts, setLocalFonts] = useState<string[]>([]);
  const [isDorsalModalOpen, setIsDorsalModalOpen] = useState<boolean>(false);


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
    if (designs.length === 0) loadDesignsFromDatabase();
    void getAllStoredCustomFonts().then((stored) => {
      if (stored.length > 0) {
        setLocalFonts((prev) => Array.from(new Set([...prev, ...stored.map((s) => s.name)])));
      }
    });
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
          void loadGoogleFont(activeRule.fontFamily);
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

    // Sincronizar en todas las variantes de delantero
    const frontPieces: PieceType[] = ['DELANTERO', 'DELANTERO_V', 'DELANTERO_REDONDO'];
    for (const dType of frontPieces) {
      if (activeDesign.pieceArtworks[dType]) {
        updatePlaceholderRule(activeDesign.id, dType, 'NUMERO_FRENTE', updates);
        updatePlaceholderRule(activeDesign.id, dType, 'NUMERO_DELANTERO', updates);
      }
    }

    // Sincronizar en todas las piezas de pantaloneta/short
    const shortPieces: PieceType[] = ['PANTALONETA_IZQ', 'PANTALONETA_DER', 'SHORT_FRENTE', 'SHORT_ESPALDA'];
    for (const sType of shortPieces) {
      if (activeDesign.pieceArtworks[sType]) {
        updatePlaceholderRule(activeDesign.id, sType, 'NUMERO_SHORT', updates);
      }
    }

    // Las piezas generadas contienen una instantánea SVG del diseño. Al cambiar
    // tipografía o color hay que reconstruirlas y descartar el rollo anterior;
    // de lo contrario la inspección sigue mostrando el estilo viejo.
    if (useGeneratorStore.getState().generatedPieces.length > 0) {
      useGeneratorStore.getState().generatePieces();
      useNestingStore.getState().clearNesting();
    }
  };

  const handleSelectFont = async (fontFamily: string) => {
    setActiveFontFamily(fontFamily);
    const curvesReady = await loadGoogleFont(fontFamily);
    applyStyleUpdates({ fontFamily });
    const localOption = POPULAR_SPORTS_FONTS.find((font) => font.family === fontFamily)?.isLocal;
    if (localOption && !curvesReady) {
      setIsDorsalModalOpen(true);
    }
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
    if (!file || !activeDesign) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setPieceArtwork(pieceType, content);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      showAlert.error('Error de lectura', 'No se pudo leer el archivo SVG seleccionado.');
    };
    reader.readAsText(file);
  };

  // Carga masiva de múltiples archivos juntos
  const handleUploadMultipleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
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
          if (readFiles.length > 0) {
            importMultiBlockFiles(readFiles);
          }
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        completed++;
        if (completed === files.length) {
          if (readFiles.length > 0) {
            importMultiBlockFiles(readFiles);
          }
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    });
  };

  const frenteArt = activeDesign?.pieceArtworks['DELANTERO'] || activeDesign?.pieceArtworks['DELANTERO_REDONDO'] || activeDesign?.pieceArtworks['DELANTERO_V'];
  const espaldaArt = activeDesign?.pieceArtworks['ESPALDA'];
  const mangaIzqArt = activeDesign?.pieceArtworks['MANGA_IZQ'];
  const mangaDerArt = activeDesign?.pieceArtworks['MANGA_DER'];
  const pantalonetaIzqArt = activeDesign?.pieceArtworks['PANTALONETA_IZQ'] || activeDesign?.pieceArtworks['SHORT_FRENTE'];
  const pantalonetaDerArt = activeDesign?.pieceArtworks['PANTALONETA_DER'] || activeDesign?.pieceArtworks['SHORT_ESPALDA'];

  const activeMainBlocksCount = [
    Boolean(frenteArt?.svgArtContent),
    Boolean(espaldaArt?.svgArtContent),
    Boolean(mangaIzqArt?.svgArtContent),
    Boolean(mangaDerArt?.svgArtContent),
  ].filter(Boolean).length;

  const renderSaveDesignButton = (extraClassName = '') => (
    <button
      type="button"
      onClick={handleExplicitSaveDesign}
      disabled={!activeDesign || saveStatus === 'SAVING' || isUploading}
      className={`text-xs px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs ${
        saveStatus === 'SAVED'
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          : saveStatus === 'SAVING'
            ? 'bg-violet-500 text-white cursor-wait'
            : 'bg-violet-600 hover:bg-violet-700 text-white active:scale-95'
      } ${extraClassName}`}
      title="Guardar y sincronizar explícitamente el diseño actual en la base de datos"
    >
      {saveStatus === 'SAVING' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Guardando diseño...</span>
        </>
      ) : saveStatus === 'SAVED' ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>¡Diseño Guardado!</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>Guardar Diseño</span>
        </>
      )}
    </button>
  );

  return (
    <div className="h-full min-h-0 p-5 flex flex-col overflow-hidden max-w-[1600px] w-full mx-auto">
      {/* Input de carga masiva de bloques SVG del modelo */}
      <input
        ref={multiInputRef}
        type="file"
        accept=".svg"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUploadMultipleFiles(e.target.files)}
      />

      {/* Grilla Principal con Scroll Independiente en ambas columnas */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5">
        {/* Columna Izquierda: Modelos con scroll independiente */}
        <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Modelos ({designs.length})
            </h3>
            <button
              onClick={() => createNewDesign()}
              disabled={isUploading || saveStatus === 'SAVING'}
              className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Crear nuevo modelo"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {designs.map((d) => {
              const isSelected = activeDesign?.id === d.id;
              const hasFrente = Boolean(
                d.pieceArtworks['DELANTERO_REDONDO'] ||
                  d.pieceArtworks['DELANTERO_V'] ||
                  d.pieceArtworks['DELANTERO']
              );
              const hasEspalda = Boolean(d.pieceArtworks['ESPALDA']);
              const hasMangaIzq = Boolean(d.pieceArtworks['MANGA_IZQ']);
              const hasMangaDer = Boolean(d.pieceArtworks['MANGA_DER']);
              const hasShortFrente = Boolean(
                d.pieceArtworks['PANTALONETA_IZQ'] || d.pieceArtworks['SHORT_FRENTE']
              );
              const hasShortEspalda = Boolean(
                d.pieceArtworks['PANTALONETA_DER'] || d.pieceArtworks['SHORT_ESPALDA']
              );
              const blocksReady = [hasFrente, hasEspalda, hasMangaIzq, hasMangaDer].filter(Boolean).length;
              const shortBlocksReady = [hasShortFrente, hasShortEspalda].filter(Boolean).length;
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveDesign(d)}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50/50 shadow-xs ring-1 ring-violet-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{d.name}</span>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                      blocksReady >= 3 
                        ? 'bg-violet-100 text-violet-800 border border-violet-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      Camiseta {blocksReady}/4 · Short {shortBlocksReady}/2
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {designs.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                disabled={isUploading || saveStatus === 'SAVING'}
                onClick={async () => {
                  const confirmed = await showAlert.confirm(
                    '¿Eliminar todos los modelos?',
                    'Esta acción borrará permanentemente todos los diseños maestros cargados.'
                  );
                  if (confirmed) {
                    clearAllDesigns();
                    showAlert.toast('info', 'Modelos limpiados');
                  }
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-medium border border-slate-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar todos
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Configuración y Ranuras de Bloques con scroll independiente */}
        {activeDesign ? (
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden">
            {/* Header fijo del Editor */}
            <div className="p-5 border-b border-slate-200 shrink-0 bg-white">
              {/* Título editable del modelo + Insignias de estado + Acciones principales */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600 flex-shrink-0" />
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
                        className="bg-white border border-violet-500 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-900 focus:outline-none shadow-2xs"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          updateDesignName(activeDesign.id, editedName);
                          setIsEditingName(false);
                        }}
                        className="p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900">{activeDesign.name}</h3>
                      <button
                        onClick={() => {
                          setEditedName(activeDesign.name);
                          setIsEditingName(true);
                        }}
                        disabled={isUploading || saveStatus === 'SAVING'}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-violet-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title="Renombrar este modelo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Insignia de piezas cargadas */}
                  {activeMainBlocksCount >= 4 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      {activeMainBlocksCount}/4 piezas listas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      {activeMainBlocksCount}/4 piezas cargadas
                    </span>
                  )}

                  {/* Insignia de estado de guardado y sincronización */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                    {saveStatus === 'SAVING' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-violet-600" />
                        <span className="text-violet-700">Guardando diseño...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-700">✓ Guardado y sincronizado</span>
                        {lastSavedAt && (
                          <span className="text-slate-500 font-mono text-[10px]">· {lastSavedAt}</span>
                        )}
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {renderSaveDesignButton()}

                  <button
                    type="button"
                    onClick={() => multiInputRef.current?.click()}
                    disabled={!activeDesign || isUploading || saveStatus === 'SAVING'}
                    className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 py-2 font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs active:scale-95"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>⏳ Cargando archivo SVG...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Subir bloques del modelo (SVG)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDorsalModalOpen(true)}
                    disabled={!activeDesign || isUploading || saveStatus === 'SAVING'}
                    className="rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-4 py-2 font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs active:scale-95"
                    title="Configurar tipografía, colores y muestra del dorsal"
                  >
                    <Type className="w-3.5 h-3.5 text-violet-600" />
                    <span>Configurar Dorsal ({activeFontFamily})</span>
                  </button>
                  <button
                    onClick={() => deleteDesign(activeDesign.id)}
                    disabled={!activeDesign || isUploading || saveStatus === 'SAVING'}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Eliminar este modelo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Desplegable de Configuración de Dorsal (Limpio y Fuera del Flujo Principal) */}
            <DorsalConfigModal
              isOpen={isDorsalModalOpen}
              onClose={() => setIsDorsalModalOpen(false)}
              activeFontFamily={activeFontFamily}
              onSelectFont={handleSelectFont}
              localFonts={localFonts}
              onUploadFontFile={(file) => {
                loadCustomFontFromFile(file).then((name) => {
                  setLocalFonts((prev) => Array.from(new Set([name, ...prev])));
                  setActiveFontFamily(name);
                  applyStyleUpdates({ fontFamily: name });
                  showAlert.toast('success', `Fuente "${name}" cargada con éxito`);
                });
              }}
              fillHex={fillHex}
              fillCmyk={fillCmyk}
              onFillHexChange={handleFillHexChange}
              onFillCmykChange={handleFillCmykChange}
              sampleName={sampleName}
              onSampleNameChange={setSampleName}
              sampleNumber={sampleNumber}
              onSampleNumberChange={setSampleNumber}
            />

            {/* CUERPO DEL EDITOR CON SCROLL INDEPENDIENTE */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
              <TextilePieceCarousel
                  title="Piezas de Camiseta (Frente, Espalda, Mangas)"
                  subtitle="Carga de arte para frente, espalda y mangas para entallado 1:1"
                  pieces={[
                    {
                      id: 'frente',
                      title: 'Frente',
                      subtitle: 'Arte universal de frente (cuello redondo y V)',
                      icon: <Shirt className="w-3.5 h-3.5 text-sky-500" />,
                      silhouette: <SilhouetteJerseyRound />,
                      fileName: 'Frente.svg',
                      svgContent: frenteArt?.svgArtContent,
                      namespace: 'preview_frente',
                      onUploadFile: (file: File) => {
                        handleUploadSingleBlock('DELANTERO', file);
                        handleUploadSingleBlock('DELANTERO_REDONDO', file);
                        handleUploadSingleBlock('DELANTERO_V', file);
                      },
                      onRemove: () => {
                        removePieceArtwork('DELANTERO');
                        removePieceArtwork('DELANTERO_REDONDO');
                        removePieceArtwork('DELANTERO_V');
                      },
                    },
                    {
                      id: 'espalda',
                      title: 'Espalda',
                      subtitle: 'Arte de espalda con dorsal',
                      icon: <Shirt className="w-3.5 h-3.5 text-purple-400" />,
                      silhouette: <SilhouetteJerseyBack />,
                      fileName: 'Espalda.svg',
                      svgContent: espaldaArt?.svgArtContent,
                      namespace: 'preview_espalda',
                      onUploadFile: (file: File) => handleUploadSingleBlock('ESPALDA', file),
                      onRemove: () => removePieceArtwork('ESPALDA'),
                    },
                    {
                      id: 'manga_izq',
                      title: 'Manga Izquierda',
                      subtitle: 'Arte de manga izquierda',
                      icon: <Scissors className="w-3.5 h-3.5 text-amber-400" />,
                      silhouette: <SilhouetteSleeveLeft />,
                      fileName: 'Manga Izq.svg',
                      svgContent: mangaIzqArt?.svgArtContent,
                      namespace: 'preview_manga_izq',
                      onUploadFile: (file: File) => handleUploadSingleBlock('MANGA_IZQ', file),
                      onRemove: () => removePieceArtwork('MANGA_IZQ'),
                    },
                    {
                      id: 'manga_der',
                      title: 'Manga Derecha',
                      subtitle: 'Arte de manga derecha',
                      icon: <Scissors className="w-3.5 h-3.5 text-amber-400" />,
                      silhouette: <SilhouetteSleeveRight />,
                      fileName: 'Manga Der.svg',
                      svgContent: mangaDerArt?.svgArtContent,
                      namespace: 'preview_manga_der',
                      onUploadFile: (file: File) => handleUploadSingleBlock('MANGA_DER', file),
                      onRemove: () => removePieceArtwork('MANGA_DER'),
                    },
                  ]}
                />

                {/* BLOQUES OPCIONALES DE PANTALONETA */}
                <div className="border-t border-slate-200 pt-5">
                  <TextilePieceCarousel
                    title="Pantaloneta / Short (Pierna Izquierda y Derecha)"
                    subtitle="Opcional. Se combina con los moldes de short de cada talla durante el entallado."
                    pieces={[
                      {
                        id: 'short_izq',
                        title: 'Pantaloneta — Pierna Izquierda',
                        subtitle: 'Arte pierna izquierda',
                        icon: <Scissors className="w-3.5 h-3.5 text-emerald-600" />,
                        silhouette: <SilhouetteShort />,
                        fileName: 'PANTALONETA_IZQ.svg',
                        svgContent: pantalonetaIzqArt?.svgArtContent,
                        namespace: 'preview_short_izq',
                        aspectRatio: 'square' as const,
                        onUploadFile: (file: File) => handleUploadSingleBlock('PANTALONETA_IZQ', file),
                        onRemove: () => {
                          removePieceArtwork('PANTALONETA_IZQ');
                          removePieceArtwork('SHORT_FRENTE');
                        },
                      },
                      {
                        id: 'short_der',
                        title: 'Pantaloneta — Pierna Derecha',
                        subtitle: 'Arte pierna derecha',
                        icon: <Scissors className="w-3.5 h-3.5 text-emerald-600" />,
                        silhouette: <SilhouetteShort />,
                        fileName: 'PANTALONETA_DER.svg',
                        svgContent: pantalonetaDerArt?.svgArtContent,
                        namespace: 'preview_short_der',
                        aspectRatio: 'square' as const,
                        onUploadFile: (file: File) => handleUploadSingleBlock('PANTALONETA_DER', file),
                        onRemove: () => {
                          removePieceArtwork('PANTALONETA_DER');
                          removePieceArtwork('SHORT_ESPALDA');
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
        ) : (
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
            <Palette className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Selecciona o crea un modelo de diseño</h3>
            <button
              onClick={() => createNewDesign()}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              Crear Nuevo Modelo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
