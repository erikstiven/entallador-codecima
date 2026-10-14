import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  sizeVariant?: 'sm' | 'md' | 'lg';
  className?: string;
  containerClassName?: string;
  name?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onChange,
  options,
  children,
  placeholder = '-- Seleccionar --',
  disabled = false,
  hasError = false,
  sizeVariant = 'sm',
  className = '',
  containerClassName = '',
  name,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    opensUpward: boolean;
  } | null>(null);

  // Extraer opciones desde children (<option>) si no se pasa array de options
  const parsedOptions: SelectOption[] = useMemo(() => {
    if (options && options.length > 0) return options;
    const extracted: SelectOption[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const val = String((child.props as any).value ?? (child.props as any).children ?? '');
        const lbl = String((child.props as any).children ?? (child.props as any).value ?? '');
        extracted.push({
          value: val,
          label: lbl,
          disabled: Boolean((child.props as any).disabled),
        });
      }
    });
    return extracted;
  }, [options, children]);

  const currentValue = String(value !== undefined ? value : defaultValue ?? '');

  const selectedOption = useMemo(() => {
    return parsedOptions.find((opt) => opt.value === currentValue);
  }, [parsedOptions, currentValue]);

  // Actualizar posición del menú flotante al abrir o hacer scroll/resize
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(parsedOptions.length * 36 + 10, 240);
      const spaceBelow = window.innerHeight - rect.bottom;
      const opensUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setMenuPosition({
        top: opensUpward ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 130),
        opensUpward,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, parsedOptions.length]);

  // Listener para cerrar al hacer clic afuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: val, name } });
    }
  };

  const sizeClasses = {
    sm: 'h-8 py-1 pl-2.5 pr-2 text-xs rounded-lg',
    md: 'h-9 py-1.5 pl-3 pr-2.5 text-xs rounded-lg',
    lg: 'h-10 py-2 pl-3.5 pr-3 text-sm rounded-xl',
  }[sizeVariant];

  return (
    <div className={`relative inline-block w-full ${containerClassName}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 bg-white text-slate-800 font-medium transition-all cursor-pointer focus:outline-none shadow-2xs disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${sizeClasses} ${
          hasError
            ? 'border border-red-400 text-red-600 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
            : isOpen
            ? 'border border-violet-500 ring-2 ring-violet-500/15'
            : 'border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20'
        } ${className}`}
      >
        <span className="truncate text-left flex-1 font-inherit">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-violet-600' : ''
          }`}
        />
      </button>

      {/* Menú Flotante Portal (Nunca se corta por overflow de tablas) */}
      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
            className="fixed z-[99999] bg-white border border-slate-200 rounded-xl shadow-2xl p-1 max-h-60 overflow-y-auto flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans"
          >
            {parsedOptions.map((opt) => {
              const isSelected = opt.value === currentValue;
              return (
                <div
                  key={opt.value}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors select-none ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-violet-50 text-violet-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
