import { create } from 'zustand';

export type AlertType = 'confirm' | 'alert';
export type AlertIconType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalConfig {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  icon: AlertIconType;
  isDestructive: boolean;
  resolve?: (value: boolean) => void;
}

export interface ToastItem {
  id: string;
  icon: AlertIconType;
  title: string;
  duration?: number;
}

interface AlertStoreState {
  modal: AlertModalConfig;
  toasts: ToastItem[];
  openConfirm: (options: {
    title: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: AlertIconType;
    isDestructive?: boolean;
  }) => Promise<boolean>;
  openAlert: (options: {
    title: string;
    text?: string;
    confirmButtonText?: string;
    icon?: AlertIconType;
  }) => Promise<boolean>;
  closeModal: (confirmed: boolean) => void;
  addToast: (icon: AlertIconType, title: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const initialModalState: AlertModalConfig = {
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  icon: 'info',
  isDestructive: false,
  resolve: undefined,
};

export const useAlertStore = create<AlertStoreState>((set, get) => ({
  modal: initialModalState,
  toasts: [],

  openConfirm: ({
    title,
    text,
    confirmButtonText = 'Sí, continuar',
    cancelButtonText = 'Cancelar',
    icon = 'warning',
    isDestructive,
  }) => {
    return new Promise<boolean>((resolve) => {
      // Si ya había un resolver pendiente, ciérralo
      const prevResolve = get().modal.resolve;
      if (prevResolve) {
        prevResolve(false);
      }

      const destructive =
        isDestructive !== undefined
          ? isDestructive
          : /eliminar|borrar|limpiar|resetear|quitar/i.test(title + ' ' + (text || ''));

      set({
        modal: {
          isOpen: true,
          type: 'confirm',
          title,
          message: text,
          confirmText: confirmButtonText,
          cancelText: cancelButtonText,
          icon,
          isDestructive: destructive,
          resolve,
        },
      });
    });
  },

  openAlert: ({
    title,
    text,
    confirmButtonText = 'Aceptar',
    icon = 'info',
  }) => {
    return new Promise<boolean>((resolve) => {
      const prevResolve = get().modal.resolve;
      if (prevResolve) {
        prevResolve(true);
      }

      set({
        modal: {
          isOpen: true,
          type: 'alert',
          title,
          message: text,
          confirmText: confirmButtonText,
          icon,
          isDestructive: false,
          resolve,
        },
      });
    });
  },

  closeModal: (confirmed: boolean) => {
    const { resolve } = get().modal;
    set({
      modal: {
        ...get().modal,
        isOpen: false,
        resolve: undefined,
      },
    });
    if (resolve) {
      resolve(confirmed);
    }
  },

  addToast: (icon: AlertIconType, title: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, icon, title, duration };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // Mantener máximo 5 toasts simultáneos
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
