import Swal, { SweetAlertOptions, SweetAlertIcon } from 'sweetalert2';

/**
 * Modern SweetAlert2 setup with sleek, professional 2026 SaaS design.
 * - Standardized border-radius: rounded-xl for modal card, rounded-lg for buttons.
 * - Compact, elegant icon badge (44px) instead of bloated 88px circle.
 * - Clean neutral light palette with clear primary and destructive actions.
 */
const CustomSwal = Swal.mixin({
  customClass: {
    popup: 'swal2-modern-popup !rounded-2xl !border !border-slate-200 !shadow-2xl !p-6 !font-sans !bg-white !max-w-md',
    title: 'swal2-modern-title !text-base !font-bold !text-slate-900 !tracking-tight !m-0 !mt-2',
    htmlContainer: 'swal2-modern-text !text-xs !text-slate-600 !leading-relaxed !m-0 !mt-2',
    confirmButton: 'inline-flex items-center justify-center px-4 py-2 !rounded-lg text-xs font-bold !text-white !bg-violet-600 hover:!bg-violet-700 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50',
    cancelButton: 'inline-flex items-center justify-center px-4 py-2 !rounded-lg text-xs font-semibold !text-slate-700 !bg-white hover:!bg-slate-50 !border !border-slate-200 shadow-xs cursor-pointer transition-all active:scale-95',
    actions: '!flex !items-center !justify-end !gap-3 !w-full !mt-6 !pt-4 !border-t !border-slate-100 !m-0',
  },
  buttonsStyling: false,
});

/**
 * Modern, crisp Toast notification anchored at top-right with subtle shadow.
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'swal2-modern-toast !border !border-slate-200 !rounded-lg !bg-white !shadow-lg !py-2.5 !px-3.5 !text-slate-800 !text-xs !font-medium',
    title: '!text-xs !font-medium !text-slate-800 !m-0',
    timerProgressBar: '!bg-violet-500/30',
  },
  buttonsStyling: false,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const showAlert = {
  /**
   * Muestra un modal de Éxito estilizado
   */
  success: (title: string, text?: string, options?: SweetAlertOptions) => {
    return CustomSwal.fire({
      icon: 'success',
      title,
      text,
      iconColor: '#10b981', // emerald-500
      ...options,
    });
  },

  /**
   * Muestra un modal de Error detallado
   */
  error: (title: string, text?: string, options?: SweetAlertOptions) => {
    return CustomSwal.fire({
      icon: 'error',
      title,
      text,
      iconColor: '#ef4444', // red-500
      ...options,
    });
  },

  /**
   * Muestra un modal de Advertencia
   */
  warning: (title: string, text?: string, options?: SweetAlertOptions) => {
    return CustomSwal.fire({
      icon: 'warning',
      title,
      text,
      iconColor: '#f59e0b', // amber-500
      ...options,
    });
  },

  /**
   * Muestra un modal Informativo
   */
  info: (title: string, text?: string, options?: SweetAlertOptions) => {
    return CustomSwal.fire({
      icon: 'info',
      title,
      text,
      iconColor: '#0284c7', // sky-600
      ...options,
    });
  },

  /**
   * Muestra un modal de Confirmación moderno (Aceptar / Cancelar)
   */
  confirm: async (
    title: string,
    text: string,
    confirmButtonText = 'Sí, continuar',
    cancelButtonText = 'Cancelar',
    icon: SweetAlertIcon = 'warning',
    isDestructive?: boolean
  ): Promise<boolean> => {
    const isDangerous = isDestructive !== undefined 
      ? isDestructive 
      : /eliminar|borrar|limpiar|resetear|quitar/i.test(title + ' ' + text);

    const result = await CustomSwal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
      customClass: {
        popup: 'swal2-modern-popup !rounded-2xl !border !border-slate-200 !shadow-2xl !p-6 !font-sans !bg-white !max-w-md',
        title: 'swal2-modern-title !text-base !font-bold !text-slate-900 !tracking-tight !m-0 !mt-2',
        htmlContainer: 'swal2-modern-text !text-xs !text-slate-600 !leading-relaxed !m-0 !mt-2',
        confirmButton: isDangerous
          ? 'inline-flex items-center justify-center px-4 py-2 !rounded-lg text-xs font-bold !text-white !bg-red-600 hover:!bg-red-700 shadow-xs cursor-pointer transition-all active:scale-95'
          : 'inline-flex items-center justify-center px-4 py-2 !rounded-lg text-xs font-bold !text-white !bg-violet-600 hover:!bg-violet-700 shadow-xs cursor-pointer transition-all active:scale-95',
        cancelButton: 'inline-flex items-center justify-center px-4 py-2 !rounded-lg text-xs font-semibold !text-slate-700 !bg-white hover:!bg-slate-50 !border !border-slate-200 shadow-xs cursor-pointer transition-all active:scale-95',
        actions: '!flex !items-center !justify-end !gap-3 !w-full !mt-6 !pt-4 !border-t !border-slate-100 !m-0',
      },
    });
    return result.isConfirmed;
  },

  /**
   * Notificación flotante rápida en la esquina superior derecha
   */
  toast: (icon: SweetAlertIcon, title: string) => {
    return Toast.fire({
      icon,
      title,
    });
  },
};

export default showAlert;
