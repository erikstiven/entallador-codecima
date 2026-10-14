import React, { useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { useAlertStore, AlertIconType } from './alertStore';

export const GlobalAlertHost: React.FC = () => {
  const modal = useAlertStore((state) => state.modal);
  const closeModal = useAlertStore((state) => state.closeModal);
  const toasts = useAlertStore((state) => state.toasts);
  const removeToast = useAlertStore((state) => state.removeToast);

  // Escucha tecla Escape para cerrar el modal cancelando
  useEffect(() => {
    if (!modal.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal.isOpen, closeModal]);

  const renderIcon = (icon: AlertIconType) => {
    switch (icon) {
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 border-2 border-amber-200 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 stroke-[2.25]" />
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 border-2 border-red-200 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 stroke-[2.25]" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 border-2 border-emerald-200 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 stroke-[2.25]" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 border-2 border-sky-200 flex items-center justify-center mb-3">
            <Info className="w-6 h-6 stroke-[2.25]" />
          </div>
        );
    }
  };

  const renderToastIcon = (icon: AlertIconType) => {
    switch (icon) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <>
      {/* 1. Modal Nativo Centrado Reutilizable */}
      {modal.isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal(false);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-sm sm:max-w-md w-full flex flex-col items-center text-center transform transition-all animate-modal-in"
          >
            {/* Ícono de Estado Centrado */}
            {renderIcon(modal.icon)}

            {/* Título */}
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {modal.title}
            </h3>

            {/* Mensaje descriptivo */}
            {modal.message && (
              <p className="text-xs text-slate-600 leading-relaxed mt-2 max-w-xs sm:max-w-sm">
                {modal.message}
              </p>
            )}

            {/* Barra de Acciones Centradas */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3 w-full">
              {modal.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => closeModal(false)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  {modal.cancelText || 'Cancelar'}
                </button>
              )}

              <button
                type="button"
                onClick={() => closeModal(true)}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer transition-all active:scale-95 ${
                  modal.isDestructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-violet-600 hover:bg-violet-700'
                }`}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Contenedor de Toasts Flotantes */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-2 sm:px-0">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white border border-slate-200 rounded-lg shadow-lg py-2.5 px-3.5 flex items-center justify-between gap-2.5 text-xs text-slate-800 font-medium transition-all animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {renderToastIcon(toast.icon)}
                <span className="truncate">{toast.title}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
