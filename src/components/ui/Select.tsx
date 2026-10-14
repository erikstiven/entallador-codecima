import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  sizeVariant?: 'sm' | 'md' | 'lg';
  hasError?: boolean;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      containerClassName = '',
      sizeVariant = 'sm',
      hasError = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 py-1 pl-2.5 pr-7 text-xs rounded-lg',
      md: 'h-9 py-1.5 pl-3 pr-8 text-xs rounded-lg',
      lg: 'h-10 py-2 pl-3.5 pr-9 text-sm rounded-xl',
    }[sizeVariant];

    return (
      <div className={`relative inline-block w-full ${containerClassName}`}>
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none bg-white text-slate-800 font-medium transition-all cursor-pointer focus:outline-none shadow-2xs disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${sizeClasses} ${
            hasError
              ? 'border border-red-500 text-red-700 bg-red-50/50 focus:border-red-600 focus:ring-1 focus:ring-red-500/20'
              : 'border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
      </div>
    );
  }
);

Select.displayName = 'Select';
