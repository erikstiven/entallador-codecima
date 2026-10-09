import React, { useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  UploadCloud, 
  Trash2, 
  RefreshCw,
  Maximize2
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
  /** Nombre sugerido de archivo (ej. "Frente Redondo.svg") */
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

export const TextilePieceCard: React.FC<TextilePieceCardProps> = ({
  title,
  subtitle,
  icon,
  silhouette,
  fileName = 'archivo.svg',
  svgContent,
  status,
  statusMessage,
  namespace,
  onUploadFile,
  onRemove,
  onInspect,
  aspectRatio = '3/4',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoaded = Boolean(svgContent);
  const computedStatus: PieceStatus = status || (isLoaded ? 'loaded' : 'pending');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectClass = 
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === '4/5' ? 'aspect-[4/5]' : 'aspect-[3/4]';

  return (
    <div className={`bg-slate-950/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 transition-all duration-200 shadow-sm hover:shadow-md group ${className}`}>
      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".svg"
        className="hidden"
      />

      {/* Encabezado con Icono, Título y Badge de Estado */}
      <div className="flex items-center justify-between gap-1.5 min-h-[24px]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {icon && <span className="flex-shrink-0 text-slate-300">{icon}</span>}
          <span className="font-bold text-[12px] text-white truncate" title={subtitle || title}>
            {title}
          </span>
        </div>

        {computedStatus === 'loaded' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs flex-shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5" /> Cargado
          </span>
        )}
        {computedStatus === 'pending' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs flex-shrink-0">
            <AlertCircle className="w-2.5 h-2.5" /> Pendiente
          </span>
        )}
        {computedStatus === 'needs_review' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs flex-shrink-0" title={statusMessage}>
            <AlertTriangle className="w-2.5 h-2.5" /> Revisar
          </span>
        )}
      </div>

      {/* Zona de Drop / Visualización con Proporción Textil Coherente */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full ${aspectClass} rounded-xl border flex items-center justify-center p-2 cursor-pointer overflow-hidden transition-all duration-200 ${
          isLoaded
            ? 'border-slate-700/80 bg-slate-900/90 hover:border-violet-500/80 shadow-inner'
            : 'border-dashed border-slate-800 hover:border-violet-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        {isLoaded ? (
          <>
            <SvgTextilePreview
              svgContent={svgContent}
              namespace={namespace}
            />
            {onInspect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect();
                }}
                className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-violet-600 text-slate-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md"
                title="Ampliar vista previa"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-2 select-none relative z-10 p-2">
            {/* Silueta vectorial tenue de guía */}
            {silhouette && (
              <div className="text-slate-700 group-hover:text-slate-600 transition-colors">
                {silhouette}
              </div>
            )}
            <div className="bg-slate-900/90 border border-slate-800 group-hover:border-violet-500/40 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 shadow-sm group-hover:scale-105 transition-all">
              <UploadCloud className="w-3.5 h-3.5 text-violet-400" />
              <span className="truncate max-w-[120px]">{fileName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Acciones Inferior */}
      {isLoaded ? (
        <div className="flex items-center justify-between pt-0.5 text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Reemplazar</span>
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-[11px] font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Quitar</span>
            </button>
          )}
        </div>
      ) : (
        <div className="text-[10px] text-slate-500 text-center truncate">
          Click para cargar SVG
        </div>
      )}
    </div>
  );
};
