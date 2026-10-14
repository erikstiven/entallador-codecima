import { useAlertStore, AlertIconType } from './alertStore';

/**
 * Sistema nativo de modales, alertas y notificaciones Toast para CimaTex.
 * - 100% React y Tailwind CSS, sin dependencias externas (reemplazo completo de SweetAlert2).
 * - Modales perfectamente centrados, reactivos, accesibles (Esc, backdrop) y con botones de acción limpios.
 * - Toasts flotantes ligeros en esquina superior derecha con auto-descarte.
 */
export const showAlert = {
  /**
   * Muestra un modal de Confirmación moderno (Aceptar / Cancelar)
   * Devuelve Promise<boolean> (true si confirma, false si cancela o presiona Esc)
   */
  confirm: (
    title: string,
    text: string,
    confirmButtonText = 'Sí, continuar',
    cancelButtonText = 'Cancelar',
    icon: AlertIconType = 'warning',
    isDestructive?: boolean
  ): Promise<boolean> => {
    return useAlertStore.getState().openConfirm({
      title,
      text,
      confirmButtonText,
      cancelButtonText,
      icon,
      isDestructive,
    });
  },

  /**
   * Muestra un modal de Éxito estilizado
   */
  success: (title: string, text?: string, _options?: Record<string, unknown>) => {
    return useAlertStore.getState().openAlert({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
  },

  /**
   * Muestra un modal de Error detallado
   */
  error: (title: string, text?: string, _options?: Record<string, unknown>) => {
    return useAlertStore.getState().openAlert({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  },

  /**
   * Muestra un modal de Advertencia
   */
  warning: (title: string, text?: string, _options?: Record<string, unknown>) => {
    return useAlertStore.getState().openAlert({
      title,
      text,
      icon: 'warning',
      confirmButtonText: 'Entendido',
    });
  },

  /**
   * Muestra un modal Informativo
   */
  info: (title: string, text?: string, _options?: Record<string, unknown>) => {
    return useAlertStore.getState().openAlert({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'Aceptar',
    });
  },

  /**
   * Notificación flotante rápida en la esquina superior derecha
   */
  toast: (icon: AlertIconType | 'question', title: string) => {
    const safeIcon: AlertIconType = icon === 'question' ? 'info' : icon;
    useAlertStore.getState().addToast(safeIcon, title, 3000);
  },
};

export default showAlert;
