import Swal, { SweetAlertOptions, SweetAlertIcon } from 'sweetalert2';

// Configuración base con el tema visual de CimaPattern (Dark UI / Violeta / Neón)
const CustomSwal = Swal.mixin({
  background: '#090d16',
  color: '#f1f5f9',
  confirmButtonColor: '#7c3aed', // violet-600
  cancelButtonColor: '#334155', // slate-700
  customClass: {
    popup: 'border border-slate-800 rounded-2xl shadow-2xl shadow-purple-950/60 backdrop-blur-md text-slate-100 font-sans',
    title: 'text-lg font-bold text-slate-100 tracking-wide',
    htmlContainer: 'text-xs text-slate-300 leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-purple-950/50 transition-all cursor-pointer',
    cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer',
    actions: 'gap-3 mt-4',
  },
  buttonsStyling: false,
});

// Notificaciones flotantes tipo Toast (no intrusivas)
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: '#090d16',
  color: '#f8fafc',
  customClass: {
    popup: 'border border-slate-800 rounded-xl shadow-xl shadow-purple-950/50 text-xs backdrop-blur-md',
    title: 'text-xs font-semibold text-slate-200',
  },
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
      iconColor: '#38bdf8', // sky-400
      ...options,
    });
  },

  /**
   * Muestra un modal de Confirmación (Aceptar / Cancelar)
   */
  confirm: async (
    title: string,
    text: string,
    confirmButtonText = 'Sí, continuar',
    cancelButtonText = 'Cancelar',
    icon: SweetAlertIcon = 'warning'
  ): Promise<boolean> => {
    const result = await CustomSwal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
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
