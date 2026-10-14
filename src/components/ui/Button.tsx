import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'btn-brand-primary bg-brand-primary bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-xs active:scale-95 transition-all rounded-lg',
  secondary:
    'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-2xs active:scale-95 transition-all rounded-lg',
  destructive:
    'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-semibold active:scale-95 transition-all rounded-lg',
  ghost:
    'hover:bg-slate-100 text-slate-600 active:bg-slate-200/60 font-medium transition-all rounded-lg',
  outline:
    'border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium shadow-2xs active:scale-95 transition-all rounded-lg',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm sm:text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === 'primary';
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        data-variant={variant}
        data-brand-btn={isPrimary ? 'true' : undefined}
        disabled={disabled || isLoading}
        style={style}
        className={`inline-flex items-center justify-center font-medium rounded-lg select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
