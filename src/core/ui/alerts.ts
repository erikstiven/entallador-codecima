import Swal, { SweetAlertOptions, SweetAlertIcon } from 'sweetalert2';

// Notificaciones SweetAlert2 dinámicas que respetan el tema Claro / Oscuro del sistema
const getIsLight = () => typeof document !== 'undefined' && document.documentElement.classList.contains('light');

const CustomSwal = Swal.mixin({
  confirmButtonColor: '#7c3aed',
  cancelButtonColor: '#475569',
  customClass: {
    popup: 'swal2-cima-popup border rounded-2xl shadow-2xl backdrop-blur-md font-sans',
    title: 'swal2-cima-title text-base font-bold tracking-wide',
    htmlContainer: 'swal2-cima-text text-xs leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-purple-950/50 transition-all cursor-pointer',
    cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer',
    actions: 'gap-3 mt-4',
  },
  buttonsStyling: false,
  willOpen: (popup) => {
    const isLight = getIsLight();
    popup.style.backgroundColor = isLight ? '#ffffff' : '#090d16';
    popup.style.color = isLight ? '#0f172a' : '#f1f5f9';
    popup.style.borderColor = isLight ? '#cbd5e1' : '#1e293b';
  },
});

// Notificaciones flotantes tipo Toast que respetan el modo Claro / Oscuro
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: {
    popup: 'swal2-cima-toast border rounded-xl shadow-xl text-xs backdrop-blur-md',
    title: 'text-xs font-semibold',
  },
  buttonsStyling: false,
  willOpen: (toast) => {
    const isLight = getIsLight();
    toast.style.backgroundColor = isLight ? '#ffffff' : '#090d16';
    toast.style.color = isLight ? '#0f172a' : '#f8fafc';
    toast.style.borderColor = isLight ? '#cbd5e1' : '#1e293b';
    toast.style.boxShadow = isLight ? '0 10px 25px -5px rgba(0,0,0,0.1)' : '0 10px 25px -5px rgba(0,0,0,0.6)';
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
