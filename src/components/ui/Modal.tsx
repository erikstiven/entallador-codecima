import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

export interface ModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función invocada para cerrar el modal */
  onClose: () => void;
  /** Título principal del modal */
  title?: React.ReactNode;
  /** Subtítulo descriptivo opcional */
  subtitle?: React.ReactNode;
  /** Icono representativo opcional en el encabezado */
  icon?: React.ReactNode;
  /** Contenido principal del modal */
  children: React.ReactNode;
  /** Barra de acciones o pie del modal opcional */
  footer?: React.ReactNode;
  /** Ancho máximo del contenedor (por defecto 'lg') */
  maxWidth?: ModalMaxWidth;
  /** Cerrar al hacer clic en el fondo oscuro (por defecto true) */
  closeOnBackdropClick?: boolean;
  /** Cerrar al presionar la tecla Escape (por defecto true) */
  closeOnEscape?: boolean;
  /** Mostrar u ocultar el botón (X) de cerrar en el header (por defecto true) */
  showCloseButton?: boolean;
  /** Clases CSS adicionales para el contenedor exterior */
  className?: string;
  /** Clases CSS adicionales para la tarjeta */
  panelClassName?: string;
  /** Clases CSS adicionales para el encabezado */
  headerClassName?: string;
  /** Clases CSS adicionales para el cuerpo */
  bodyClassName?: string;
  /** Clases CSS adicionales para el pie */
  footerClassName?: string;
}

const MAX_WIDTH_MAP: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[95vw]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'lg',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  panelClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = MAX_WIDTH_MAP[maxWidth] || 'max-w-lg';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasHeader = Boolean(title || icon || showCloseButton);

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150 ${className}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className={`bg-white border border-slate-200 rounded-2xl w-full ${maxWidthClass} shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Estandarizado */}
        {hasHeader && (
          <div
            className={`px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0 ${headerClassName}`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {icon && (
                <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Cuerpo del Modal con Scroll Suave */}
        <div className={`p-5 overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}>
          {children}
        </div>

        {/* Pie de Acciones Estandarizado */}
        {footer && (
          <div
            className={`px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/80 shrink-0 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
