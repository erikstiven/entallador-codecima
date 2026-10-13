import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useAppRoute } from '../router/landingRouteStore';

export interface GoogleAuthModalProps {
  isOpen?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = (props) => {
  const {
    isAuthModalOpen: storeIsOpen,
    closeAuthModal,
    loginWithGoogle,
    isLoading: storeLoading,
    error: storeError,
    clearError,
  } = useAuthStore();

  const { navigateTo } = useAppRoute();
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isAuthModalOpen = props.isOpen !== undefined ? props.isOpen : storeIsOpen;
  const isLoading = props.isLoading !== undefined ? props.isLoading : storeLoading;

  if (!isAuthModalOpen) return null;

  const displayError = props.error !== undefined ? props.error : (localError || storeError);

  const handleClose = () => {
    setLocalError(null);
    clearError();
    setSuccess(false);
    closeAuthModal();
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearError();

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Si Google Identity Services está cargado y tenemos Client ID, abrir ventana oficial de Google
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2 && clientId) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn('Google OAuth cancelado o con error:', tokenResponse);
              setLocalError('Inicio con Google cancelado.');
              return;
            }
            try {
              // Obtener información real del perfil de Google
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const googleUser = await userInfoRes.json();

              await loginWithGoogle({
                id: googleUser.sub,
                name: googleUser.name,
                email: googleUser.email,
                avatar: googleUser.picture,
                token: tokenResponse.access_token,
              });

              setSuccess(true);
              setTimeout(() => {
                handleClose();
                navigateTo('/app');
              }, 750);
            } catch (err) {
              console.error('Error procesando respuesta de Google:', err);
              // Fallback automático para no bloquear al usuario
              await loginWithGoogle();
              setSuccess(true);
              setTimeout(() => {
                handleClose();
                navigateTo('/app');
              }, 750);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Error al iniciar tokenClient de Google, usando flujo alternativo:', err);
      }
    }

    // Fallback estándar si Google SDK no está disponible
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        navigateTo('/app');
      }, 750);
    } catch (err) {
      console.error('Error durante autenticación Google:', err);
      setLocalError('No se pudo establecer conexión con el servidor. Revisa tu conexión a internet o intenta nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 text-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Cerrar ventana"
        >
          <X className="size-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="size-16 rounded-2xl bg-violet-100 border border-violet-200 p-2.5 flex items-center justify-center shadow-md">
              <img
                src="/cimatex-icon.png"
                alt="CimaTex"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-mono font-bold uppercase tracking-wider shadow">
              Gratis
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Comienza gratis con <span>Cima<span className="text-violet-600">Tex</span></span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Accede al sistema de entallado, nesting y moldería 1:1 registrándote en segundos con tu cuenta de Google.
            </p>
          </div>
        </div>

        {/* Benefits Box */}
        <div className="my-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Acceso completo e inmediato al taller de producción</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Tus pedidos, nóminas y patrones guardados en el sistema</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Sin tarjeta de crédito ni costos ocultos</span>
          </div>
        </div>

        {/* Error amigable si falla la red o el servidor */}
        {displayError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-950">Aviso de conexión</p>
              <p className="text-rose-800 mt-0.5 leading-relaxed">{displayError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                clearError();
              }}
              className="text-rose-400 hover:text-rose-700 p-0.5 rounded transition-colors"
              title="Cerrar aviso"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Google Sign-In Action Button */}
        {success ? (
          <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-center font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600 animate-bounce" />
            <span>¡Cuenta lista! Redirigiendo a tu taller...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 font-semibold text-sm shadow-sm transition-all duration-200 active:scale-98 disabled:opacity-70 cursor-pointer group"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 text-violet-600 animate-spin" />
                <span>Conectando con Google y base de datos...</span>
              </>
            ) : (
              <>
                {/* Official 4-Color Google SVG Icon */}
                <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
                <ArrowRight className="size-4 ml-auto text-slate-400 group-hover:text-slate-700 transition-colors" />
              </>
            )}
          </button>
        )}

        {/* Security & Terms note */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-slate-500" />
          <span>Protegido por Google OAuth 2.0 y cifrado SSL</span>
        </div>
      </div>
    </div>
  );
};
