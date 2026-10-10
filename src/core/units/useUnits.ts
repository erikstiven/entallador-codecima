import { useSystemSettingsStore } from '@/modules/settings/systemSettingsStore';
import { fromMm, toMm, SupportedUnit } from './units';

/**
 * Hook reactivo para formatear y convertir dimensiones físicas en la UI
 * garantizando coherencia dimensional en todo el sistema.
 */
export function useUnits() {
  const { settings } = useSystemSettingsStore();
  const unit = settings.displayUnit as SupportedUnit;
  const precision = settings.decimalPrecision;

  const unitLabel = unit === 'cm' ? 'cm' : unit === 'in' ? 'in' : 'mm';
  const unitStep = unit === 'cm' ? 0.1 : unit === 'in' ? 0.01 : 1;

  /**
   * Convierte un valor en milímetros a la unidad configurada (para mostrar en un input o número)
   */
  const toDisplay = (valueMm: number): number => {
    const converted = fromMm(valueMm, unit);
    return parseFloat(converted.toFixed(precision));
  };

  /**
   * Convierte un valor ingresado por el usuario en la unidad configurada de vuelta a milímetros exactos
   */
  const toInternalMm = (displayValue: number): number => {
    return toMm(displayValue, unit);
  };

  /**
   * Formatea un valor en milímetros a string con su unidad y precisión decimal (ej. "112.0 cm")
   */
  const format = (valueMm: number, overridePrecision?: number): string => {
    const decimals = overridePrecision !== undefined ? overridePrecision : precision;
    const converted = fromMm(valueMm, unit);
    return `${converted.toFixed(decimals)} ${unitLabel}`;
  };

  /**
   * Retorna solo el número formateado como string sin la etiqueta de unidad (ej. "112.0")
   */
  const formatNumber = (valueMm: number, overridePrecision?: number): string => {
    const decimals = overridePrecision !== undefined ? overridePrecision : precision;
    const converted = fromMm(valueMm, unit);
    return converted.toFixed(decimals);
  };

  return {
    unit,
    unitLabel,
    unitStep,
    precision,
    toDisplay,
    toInternalMm,
    format,
    formatNumber,
  };
}
