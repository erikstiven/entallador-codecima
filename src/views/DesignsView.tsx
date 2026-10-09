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
  Save
} from 'lucide-react';
import { useDesignStore } from '@/modules/designs/designStore';
import { PieceType } from '@/core/geometry/types';
import { POPULAR_SPORTS_FONTS, loadGoogleFont, loadCustomFontFromFile } from '@/core/fonts/googleFonts';
import { cmykToHex, hexToCmyk, CMYK } from '@/core/color/cmykColor';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { SvgTextilePreview, TextilePieceCarousel } from '@/components/textile';
import { showAlert } from '@/core/ui/alerts';

// Siluetas Vectoriales Guía de Alta Definición para las Ranuras de Arte
const SilhouetteJerseyRound: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M35 16 C42 25 58 25 65 16 L84 25 L75 40 L68 35 L68 86 L32 86 L32 35 L25 40 L16 25 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35 16 C42 25 58 25 65 16" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="50" cy="42" r="3" fill="currentColor" opacity="0.4" />
  </svg>
);

const SilhouetteJerseyV: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M34 16 L50 32 L66 16 L84 25 L75 40 L68 35 L68 86 L32 86 L32 35 L25 40 L16 25 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34 16 L50 32 L66 16" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="50" cy="46" r="3" fill="currentColor" opacity="0.4" />
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

interface PieceSlotCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  silhouette: React.ReactNode;
  fileName: string;
  artwork?: { svgArtContent?: string };
  inputRef: React.RefObject<HTMLInputElement | null>;
  onRemove: () => void;
  previewNamespace: string;
  accentColor?: 'sky' | 'indigo' | 'purple' | 'amber' | 'emerald';
  extraAction?: React.ReactNode;
}

const PieceSlotCard: React.FC<PieceSlotCardProps> = ({
  title,
  subtitle,
  icon,
  silhouette,
  fileName,
  artwork,
  inputRef,
  onRemove,
  previewNamespace,
  extraAction,
}) => {
  const isLoaded = Boolean(artwork?.svgArtContent);

  return (
    <div className="bg-slate-950/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 transition-all duration-200 shadow-sm hover:shadow-md group">
      {/* Encabezado con Icono, Título y Badge Shadcn */}
      <div className="flex items-center justify-between gap-1.5 min-h-[24px]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="flex-shrink-0">{icon}</span>
          <span className="font-bold text-[12px] text-white truncate" title={subtitle || title}>
            {title}
          </span>
        </div>

        {isLoaded ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs flex-shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5" /> Cargado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs flex-shrink-0">
            <AlertCircle className="w-2.5 h-2.5" /> Pendiente
          </span>
        )}
      </div>

      {/* Zona de Drop / Visualización con Proporción Textil 3:4 */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative w-full h-56 sm:h-64 rounded-xl border flex items-center justify-center p-2 cursor-pointer overflow-hidden transition-all duration-200 ${
          isLoaded
            ? 'border-slate-700 bg-slate-900/90 hover:border-violet-500/80 shadow-inner'
            : 'border-dashed border-slate-800 hover:border-violet-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        {isLoaded ? (
          <SvgTextilePreview
            svgContent={artwork?.svgArtContent}
            namespace={previewNamespace}
            className="p-2"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-3 select-none relative z-10 p-2">
            {/* Silueta vectorial tenue de fondo */}
            <div className="text-slate-700 group-hover:text-slate-600 transition-colors">
              {silhouette}
            </div>
            <div className="bg-slate-900/90 border border-slate-800 group-hover:border-violet-500/40 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 shadow-sm group-hover:scale-105 transition-all">
              <UploadCloud className="w-3.5 h-3.5 text-violet-400" />
              <span>{fileName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Acciones Inferior */}
      {isLoaded ? (
        <div className="flex items-center justify-between pt-0.5 text-xs">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
          >
            Reemplazar
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-[11px] font-medium"
          >
            Quitar
          </button>
        </div>
      ) : (
        extraAction && (
          <div className="pt-0.5">
            {extraAction}
          </div>
        )
      )}
    </div>
  );
};

export const DesignsView: React.FC = () => {
  const frenteRedondoInputRef = useRef<HTMLInputElement>(null);
  const frenteVInputRef = useRef<HTMLInputElement>(null);
  const espaldaInputRef = useRef<HTMLInputElement>(null);
  const mangaIzqInputRef = useRef<HTMLInputElement>(null);
  const mangaDerInputRef = useRef<HTMLInputElement>(null);
  const pantalonetaIzqInputRef = useRef<HTMLInputElement>(null);
  const pantalonetaDerInputRef = useRef<HTMLInputElement>(null);
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
    saveActiveDesign,
    deleteDesign,
    clearAllDesigns,
    updatePlaceholderRule,
    updateDesignName,
  } = useDesignStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveDesign = async () => {
    setSaveStatus('saving');
    const saved = await saveActiveDesign();
    setSaveStatus(saved ? 'saved' : 'error');
    if (saved) {
      showAlert.toast('success', '¡Diseño guardado con éxito!');
    } else {
      showAlert.error('Error al Guardar', 'No fue posible guardar el diseño en la base de datos.');
    }
    window.setTimeout(() => setSaveStatus('idle'), 2500);
  };

  // Tipografía seleccionada
  const [activeFontFamily, setActiveFontFamily] = useState<string>('Bebas Neue');
  const [localFonts, setLocalFonts] = useState<string[]>([]);

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fontName = await loadCustomFontFromFile(file);
      setLocalFonts((prev) => Array.from(new Set([fontName, ...prev])));
      setActiveFontFamily(fontName);
      applyStyleUpdates({ fontFamily: fontName });
      showAlert.toast('success', `Fuente "${fontName}" sincronizada`);
    } catch (err) {
      console.error('Error al cargar archivo de fuente:', err);
      showAlert.error('Error de Fuente', 'No se pudo leer el archivo TTF/OTF seleccionado.');
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
    if (designs.length === 0) loadDesignsFromDatabase();
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
    if (activeDesign.pieceArtworks['DELANTERO']) {
      updatePlaceholderRule(activeDesign.id, 'DELANTERO', 'NUMERO_FRENTE', updates);
      // Compatibilidad con diseños importados que usan el identificador anterior.
      updatePlaceholderRule(activeDesign.id, 'DELANTERO', 'NUMERO_DELANTERO', updates);
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
      fontFileInputRef.current?.click();
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

  const frenteRedondoArt = activeDesign?.pieceArtworks['DELANTERO_REDONDO'] || activeDesign?.pieceArtworks['DELANTERO'];
  const frenteVArt = activeDesign?.pieceArtworks['DELANTERO_V'];
  const isLegacyGenericDelantero = Boolean(activeDesign?.pieceArtworks['DELANTERO'] && !activeDesign?.pieceArtworks['DELANTERO_REDONDO'] && !activeDesign?.pieceArtworks['DELANTERO_V']);
  const espaldaArt = activeDesign?.pieceArtworks['ESPALDA'];
  const mangaIzqArt = activeDesign?.pieceArtworks['MANGA_IZQ'];
  const mangaDerArt = activeDesign?.pieceArtworks['MANGA_DER'];
  const pantalonetaIzqArt = activeDesign?.pieceArtworks['PANTALONETA_IZQ'] || activeDesign?.pieceArtworks['SHORT_FRENTE'];
  const pantalonetaDerArt = activeDesign?.pieceArtworks['PANTALONETA_DER'] || activeDesign?.pieceArtworks['SHORT_ESPALDA'];

  const handleCopyMangaIzqToDer = () => {
    if (!activeDesign || !mangaIzqArt) return;
    setPieceArtwork('MANGA_DER', mangaIzqArt.svgArtContent);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Inputs ocultos de carga */}
      <input
        ref={frenteRedondoInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('DELANTERO_REDONDO', e.target.files?.[0])}
      />
      <input
        ref={frenteVInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('DELANTERO_V', e.target.files?.[0])}
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
      <input
        ref={pantalonetaIzqInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('PANTALONETA_IZQ', e.target.files?.[0])}
      />
      <input
        ref={pantalonetaDerInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={(e) => handleUploadSingleBlock('PANTALONETA_DER', e.target.files?.[0])}
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
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
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
              const hasShortFrente = Boolean(d.pieceArtworks['SHORT_FRENTE']);
              const hasShortEspalda = Boolean(d.pieceArtworks['SHORT_ESPALDA']);
              const blocksReady = [hasFrente, hasEspalda, hasMangaIzq, hasMangaDer].filter(Boolean).length;
              const shortBlocksReady = [hasShortFrente, hasShortEspalda].filter(Boolean).length;
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveDesign(d)}
                  className={`bg-slate-900/90 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:border-slate-600 ${
                    isSelected
                      ? 'border-violet-500 shadow-lg shadow-purple-950/50 bg-slate-850 ring-1 ring-violet-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{d.name}</span>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-lg ${
                      blocksReady >= 3 
                        ? 'bg-purple-950 text-purple-400 border border-violet-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      Camiseta {blocksReady}/4 · Short {shortBlocksReady}/2
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {designs.length > 0 && (
            <button
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
              className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg text-xs font-medium border border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
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
                        className="bg-slate-950 border border-violet-500 rounded px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          updateDesignName(activeDesign.id, editedName);
                          setIsEditingName(false);
                        }}
                        className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors"
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
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-purple-400 rounded transition-colors"
                        title="Renombrar este modelo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDesign}
                    disabled={saveStatus === 'saving'}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-wait ${
                      saveStatus === 'saved'
                        ? 'bg-emerald-600 text-white'
                        : saveStatus === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                    title="Guardar explícitamente el diseño actual"
                  >
                    {saveStatus === 'saved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {saveStatus === 'saving'
                      ? 'Guardando...'
                      : saveStatus === 'saved'
                        ? 'Diseño guardado'
                        : saveStatus === 'error'
                          ? 'Error al guardar'
                          : 'Guardar diseño'}
                  </button>
                  <button
                    type="button"
                    onClick={() => multiInputRef.current?.click()}
                    className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-purple-400" />
                      Tipografía de Dorsal:
                    </label>

                    <div className="flex items-center gap-2">
                      <select
                        value={activeFontFamily}
                        onChange={(e) => handleSelectFont(e.target.value)}
                        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-violet-500 cursor-pointer text-xs"
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

                        <optgroup label="Fuentes incluidas en CimaPattern">
                          {POPULAR_SPORTS_FONTS.map((f) => (
                            <option key={f.family} value={f.family}>
                              {f.family} ({f.category})
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      <input
                        type="file"
                        ref={fontFileInputRef}
                        onChange={handleFontFileUpload}
                        accept=".ttf,.otf,.woff,.woff2"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fontFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap flex-shrink-0"
                        title="Seleccionar un archivo de fuente TTF, OTF, WOFF o WOFF2 desde tu equipo"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Subir Fuente</span>
                      </button>
                    </div>
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
                          className="rounded border-slate-700 text-violet-600 w-3 h-3"
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
                              className="w-16 accent-violet-500 cursor-pointer"
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
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-purple-400 font-mono text-xs w-14 text-center focus:border-violet-500 focus:outline-none font-bold"
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

              {/* Banner de Compatibilidad y Alerta si tiene Delantero Genérico Antiguo */}
              {isLegacyGenericDelantero && (
                <div className="p-3.5 bg-amber-950/50 border border-amber-500/50 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <div className="font-bold text-amber-300">Diseño Requiere Revisión — Formato Antiguo Detectado</div>
                    <p className="text-amber-200/90 leading-relaxed text-[11px]">
                      Este modelo contiene un arte <span className="font-mono font-bold">DELANTERO</span> genérico. En el nuevo sistema de producción industrial, debes cargar independientemente <span className="font-bold text-white">Delantero Redondo</span> y/o <span className="font-bold text-white">Delantero Cuello V</span> para que el entallador no sustituya piezas silenciosamente.
                    </p>
                  </div>
                </div>
              )}

              {/* LAS RANURAS DE BLOQUES DE ARTE CON VISTA CUADRÍCULA Y CARRUSEL */}
              <div className="space-y-6">
                <TextilePieceCarousel
                  title="Piezas de Camiseta (Frente Redondo, Frente V, Espalda, Mangas)"
                  subtitle="Carga independiente de variantes de cuello y mangas para evitar sustituciones silenciosas"
                  pieces={[
                    {
                      id: 'frente_redondo',
                      title: 'Frente Redondo',
                      subtitle: 'Arte para cuello redondo',
                      icon: <Shirt className="w-3.5 h-3.5 text-sky-400" />,
                      silhouette: <SilhouetteJerseyRound />,
                      fileName: 'Frente Redondo.svg',
                      svgContent: frenteRedondoArt?.svgArtContent,
                      namespace: 'preview_frente_redondo',
                      onUploadFile: (file: File) => handleUploadSingleBlock('DELANTERO_REDONDO', file),
                      onRemove: () => {
                        removePieceArtwork('DELANTERO_REDONDO');
                        removePieceArtwork('DELANTERO');
                      },
                    },
                    {
                      id: 'frente_v',
                      title: 'Frente Cuello V',
                      subtitle: 'Arte para cuello en V',
                      icon: <Shirt className="w-3.5 h-3.5 text-indigo-400" />,
                      silhouette: <SilhouetteJerseyV />,
                      fileName: 'Frente Cuello V.svg',
                      svgContent: frenteVArt?.svgArtContent,
                      namespace: 'preview_frente_v',
                      onUploadFile: (file: File) => handleUploadSingleBlock('DELANTERO_V', file),
                      onRemove: () => removePieceArtwork('DELANTERO_V'),
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
                <div className="border-t border-slate-800 pt-5">
                  <TextilePieceCarousel
                    title="Pantaloneta / Short (Pierna Izquierda y Derecha)"
                    subtitle="Opcional. Se combina con los moldes de short de cada talla durante el entallado."
                    pieces={[
                      {
                        id: 'short_izq',
                        title: 'Pantaloneta — Pierna Izquierda',
                        subtitle: 'Arte pierna izquierda',
                        icon: <Scissors className="w-3.5 h-3.5 text-emerald-400" />,
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
                        icon: <Scissors className="w-3.5 h-3.5 text-emerald-400" />,
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
          </div>
        ) : (
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
            <Palette className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Selecciona o crea un modelo de diseño</h3>
            <button
              onClick={() => createNewDesign()}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold"
            >
              Crear Nuevo Modelo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
