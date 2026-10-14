import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  ZoomOut,
  RotateCcw
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
  const [fitMode, setFitMode] = useState<'content' | 'document'>('content');

  const activePiece = pieces[activeIndex] || pieces[0];

  useEffect(() => {
    if (activeIndex >= pieces.length) setActiveIndex(Math.max(0, pieces.length - 1));
  }, [activeIndex, pieces.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : pieces.length - 1));
    setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    setFitMode('content');
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < pieces.length - 1 ? prev + 1 : 0));
    setZoomLevel(DEFAULT_PREVIEW_ZOOM);
    setFitMode('content');
  };

  const changeZoom = (delta: number) => {
    setZoomLevel((current) => Math.min(4, Math.max(0.5, current + delta)));
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
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCurrent
                        ? hasArt
                          ? 'bg-emerald-300 ring-2 ring-violet-400'
                          : 'bg-violet-300'
                        : hasArt
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                    }`}
                  />
                  <span>{piece.title}</span>
                  {hasArt && (
                    <span className={`text-[10px] font-medium ${isCurrent ? 'text-violet-200' : 'text-emerald-600'}`}>
                      (Cargado)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Escenario de Enfoque con Controles de Navegación */}
          <div className="relative w-full h-[26rem] sm:h-[30rem] bg-slate-50 border border-slate-200/90 rounded-xl overflow-hidden flex items-center justify-center p-6 sm:p-8 group">
            {/* Control de vista SVG */}
            <div className="absolute top-3 left-3 z-20 flex items-center bg-white/95 border border-slate-200 rounded-lg p-1 shadow-xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setFitMode(fitMode === 'document' ? 'content' : 'document')}
                className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Alternar encuadre de la pieza"
              >
                Vista SVG
              </button>
            </div>
            {/* Controles flotantes de Zoom */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 border border-slate-200 rounded-lg p-1 shadow-xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => changeZoom(0.25)}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => changeZoom(-0.25)}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(DEFAULT_PREVIEW_ZOOM)}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
                title="Restablecer tamaño 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-600 px-1 font-semibold">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

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

            {/* Contenido Visual con Zoom */}
            <div className="w-full h-full flex items-center justify-center transition-transform duration-150" style={{ transform: `scale(${zoomLevel})` }}>
              {activePiece.svgContent ? (
                <div className="w-full h-full max-w-full max-h-full flex items-center justify-center p-2">
                  <SvgTextilePreview
                    svgContent={activePiece.svgContent}
                    namespace={`carousel_${activePiece.namespace}`}
                    fitMode={fitMode}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 select-none">
                  {activePiece.silhouette}
                  <p className="text-xs font-semibold text-slate-500">
                    No hay arte cargado para {activePiece.title}
                  </p>
                </div>
              )}
            </div>
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
