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
      className={`text-xs px-3.5 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-sm ${
        saveStatus === 'SAVED'
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-emerald-950/50'
          : saveStatus === 'SAVING'
            ? 'bg-sky-600/80 text-white border border-sky-400/40 cursor-wait'
            : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 shadow-sky-950/40'
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
              disabled={isUploading || saveStatus === 'SAVING'}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Crear nuevo modelo"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>

          <div className="space-y-2">
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
              className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg text-xs font-medium border border-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* Título editable del modelo + Insignias de estado + Acciones principales */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 flex-shrink-0" />
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
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white">{activeDesign.name}</h3>
                      <button
                        onClick={() => {
                          setEditedName(activeDesign.name);
                          setIsEditingName(true);
                        }}
                        disabled={isUploading || saveStatus === 'SAVING'}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-purple-400 rounded transition-colors disabled:opacity-50"
                        title="Renombrar este modelo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Insignia de piezas cargadas */}
                  {activeMainBlocksCount >= 4 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {activeMainBlocksCount}/4 piezas listas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <AlertCircle className="w-3 h-3" />
                      {activeMainBlocksCount}/4 piezas cargadas
                    </span>
                  )}

                  {/* Insignia de estado de guardado y sincronización */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/90 text-emerald-400 border border-emerald-500/25">
                    {saveStatus === 'SAVING' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                        <span className="text-sky-300">Guardando diseño...</span>
                      </>
                    ) : (
                      <>
                        <span>✓ Diseño guardado y sincronizado</span>
                        {lastSavedAt && (
                          <span className="text-slate-400 font-mono text-[10px]">· {lastSavedAt}</span>
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
                    className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
                    title="Configurar tipografía, colores y muestra del dorsal"
                  >
                    <Type className="w-3.5 h-3.5 text-violet-600" />
                    <span>Configurar Dorsal ({activeFontFamily})</span>
                  </button>
                  <button
                    onClick={() => deleteDesign(activeDesign.id)}
                    disabled={!activeDesign || isUploading || saveStatus === 'SAVING'}
                    className="p-2 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar este modelo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

              {/* LAS RANURAS DE BLOQUES DE ARTE CON VISTA CUADRÍCULA Y CARRUSEL */}
              <div className="space-y-6">
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
