import React, { useEffect, useState, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  UploadCloud
} from 'lucide-react';
import { SvgTextilePreview } from './SvgTextilePreview';
export type PieceStatus = 'loaded' | 'pending' | 'needs_review';

export interface TextilePieceCardProps {
  /** Título principal de la ranura */
  title: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Icono representativo */
  icon?: React.ReactNode;
  /** Silueta vectorial guía si no hay arte cargado */
  silhouette?: React.ReactNode;
  /** Nombre sugerido de archivo (ej. "Frente.svg") */
  fileName?: string;
  /** Contenido SVG cargado */
  svgContent?: string;
  /** Estado de la pieza */
  status?: PieceStatus;
  /** Mensaje de alerta si requiere revisión */
  statusMessage?: string;
  /** Namespace único para evitar colisiones */
  namespace: string;
  /** Callback al seleccionar un archivo */
  onUploadFile?: (file: File) => void;
  /** Callback para quitar el arte */
  onRemove?: () => void;
  /** Callback para abrir en modal o vista maximizada */
  onInspect?: () => void;
  /** Proporción del contenedor (por defecto 3:4) */
  aspectRatio?: '3/4' | '4/5' | 'square';
  /** Clases CSS adicionales */
  className?: string;
}

export type TextilePieceItem = TextilePieceCardProps & { id: string };

const DEFAULT_PREVIEW_ZOOM = 1.0;

export interface TextilePieceCarouselProps {
  /** Lista de piezas a mostrar */
  pieces: TextilePieceItem[];
  /** Título de la sección */
  title?: string;
  /** Subtítulo o descripción */
  subtitle?: string;
}

export const TextilePieceCarousel: React.FC<TextilePieceCarouselProps> = ({
  pieces,
  title,
  subtitle,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_PREVIEW_ZOOM);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [panMode, setPanMode] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'content' | 'document'>('content');

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const activePiece = pieces[activeIndex] || pieces[0];

  useEffect(() => {
    if (activeIndex >= pieces.length) setActiveIndex(Math.max(0, pieces.length - 1));
  }, [activeIndex, pieces.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : pieces.length - 1));
    setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < pieces.length - 1 ? prev + 1 : 0));
    setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  const changeZoom = (delta: number) => {
    setZoomLevel((current) => Math.min(4, Math.max(0.5, current + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !activePiece.svgContent) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCarouselKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
    if (event.key === 'ArrowLeft') handlePrev();
    else if (event.key === 'ArrowRight') handleNext();
    else if (event.key === 'Home') {
      setActiveIndex(0);
      setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    } else if (event.key === 'End') {
      setActiveIndex(Math.max(0, pieces.length - 1));
      setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    } else if (event.key === '+' || event.key === '=') changeZoom(0.25);
    else if (event.key === '-') changeZoom(-0.25);
    else return;
    event.preventDefault();
  };

  return (
    <div className="space-y-3.5">
      {/* Barra de Controles y Selector de Vista con Jerarquía Clara */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          {title && (
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
              <span>{title}</span>
            </h4>
          )}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* CARRUSEL ÚNICO DE INSPECCIÓN */}
      {activePiece && (
        <div
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shadow-xs"
          tabIndex={0}
          onKeyDown={handleCarouselKeyDown}
          role="region"
          aria-label="Carrusel de piezas textiles. Use flechas para navegar y más o menos para cambiar el zoom."
        >
          {/* Selector de pestañas rápidas con jerarquía visual clara */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto scrollbar-thin">
            {pieces.map((piece, index) => {
              const isCurrent = index === activeIndex;
              const hasArt = Boolean(piece.svgContent);

              return (
                <button
                  key={piece.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    setZoomLevel(DEFAULT_PREVIEW_ZOOM);
                    setPanOffset({ x: 0, y: 0 });
                    setFitMode('content');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 flex-shrink-0 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-violet-600 text-white shadow-xs font-bold'
                      : hasArt
                        ? 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200/90 shadow-2xs font-semibold'
                        : 'bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/60 font-medium'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                      hasArt
                        ? isCurrent
                          ? 'bg-emerald-400 ring-2 ring-white shadow-2xs'
                          : 'bg-emerald-500 ring-2 ring-emerald-200 shadow-2xs'
                        : isCurrent
                          ? 'bg-violet-300'
                          : 'bg-slate-300'
                    }`}
                    title={hasArt ? 'Arte SVG cargado' : 'Sin arte cargado'}
                  />
                  <span>{piece.title}</span>
                </button>
              );
            })}
          </div>

          {/* Escenario de Enfoque con Controles de Navegación */}
          <div
            className={`relative w-full h-[26rem] sm:h-[30rem] bg-slate-50 border border-slate-200/90 rounded-xl overflow-hidden flex items-center justify-center p-6 sm:p-8 select-none group ${
              activePiece.svgContent
                ? isDragging
                  ? 'cursor-grabbing'
                  : panMode || zoomLevel > 1
                    ? 'cursor-grab'
                    : 'cursor-default'
                : ''
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Controles flotantes de Navegación y Zoom (Solo cuando hay arte cargado) */}
            {activePiece.svgContent && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 border border-slate-200 rounded-lg p-1 shadow-xs backdrop-blur-xs">
                {/* Herramienta Manito (Navegación / Arrastre) */}
                <button
                  type="button"
                  onClick={() => setPanMode((prev) => !prev)}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    panMode
                      ? 'bg-violet-100 text-violet-700 font-bold ring-1 ring-violet-300'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                  title={panMode ? 'Modo desplazamiento activo (arrastra para mover)' : 'Activar Manito para navegar/arrastrar'}
                >
                  <Hand className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => changeZoom(0.25)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
                  title="Acercar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => changeZoom(-0.25)}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
                  title="Alejar (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
                  title="Restablecer tamaño original y centrar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-600 px-1 font-semibold">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
            )}

            {/* Flecha Anterior */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={pieces.length < 2}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 hover:bg-violet-600 text-slate-600 hover:text-white border border-slate-200 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Pieza anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Flecha Siguiente */}
            <button
              type="button"
              onClick={handleNext}
              disabled={pieces.length < 2}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 hover:bg-violet-600 text-slate-600 hover:text-white border border-slate-200 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Pieza siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Contenido Visual con Zoom y Desplazamiento */}
            {activePiece.svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center pointer-events-auto"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? 'none' : 'transform 100ms ease-out',
                }}
              >
                <div className="w-full h-full max-w-full max-h-full flex items-center justify-center p-2">
                  <SvgTextilePreview
                    svgContent={activePiece.svgContent}
                    namespace={`carousel_${activePiece.namespace}`}
                    fitMode={fitMode}
                  />
                </div>
              </div>
            ) : (
              /* Recuadro de Carga Dinámica: Da clic en todo el ancho para subir o arrastrar SVG */
              <div
                onClick={() => uploadInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && activePiece.onUploadFile) {
                    activePiece.onUploadFile(file);
                  }
                }}
                className={`w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer select-none group/dropzone ${
                  isDragOver
                    ? 'border-violet-500 bg-violet-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-violet-400 bg-white/70 hover:bg-violet-50/20'
                }`}
                title={`Haz clic en el recuadro para subir arte de ${activePiece.title}`}
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && activePiece.onUploadFile) {
                      activePiece.onUploadFile(file);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-white group-hover/dropzone:bg-violet-100 border border-slate-200 group-hover/dropzone:border-violet-300 flex items-center justify-center mb-3 transition-all shadow-2xs group-hover/dropzone:scale-105">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover/dropzone:text-violet-600 transition-colors" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-800 group-hover/dropzone:text-violet-700 transition-colors">
                    Haz clic aquí o arrastra un archivo SVG
                  </p>
                  <p className="text-xs text-slate-500">
                    Cargar arte vectorial para <span className="font-semibold text-slate-700">{activePiece.title}</span>
                  </p>
                </div>
                <span className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-all group-hover/dropzone:shadow-sm">
                  <UploadCloud className="w-3.5 h-3.5 text-white" />
                  <span>Examinar archivo SVG</span>
                </span>
              </div>
            )}
          </div>

          {/* Pie de Carrusel con Acciones Rápidas */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{activePiece.title}</span>
              {activePiece.subtitle && (
                <span className="text-slate-500 text-xs hidden sm:inline">
                  — {activePiece.subtitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activePiece.onUploadFile && (
                <label className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                  {activePiece.svgContent ? 'Reemplazar SVG' : 'Subir SVG'}
                  <input
                    type="file"
                    accept=".svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && activePiece.onUploadFile) activePiece.onUploadFile(file);
                    }}
                    className="hidden"
                  />
                </label>
              )}

              {activePiece.svgContent && activePiece.onRemove && (
                <button
                  type="button"
                  onClick={activePiece.onRemove}
                  className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
