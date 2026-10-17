/**
 * HMB Entallador — Order & Excel Types
 */

export type GarmentType = 'COMPLETO' | 'CAMISETA' | 'SHORT';
export type NecklineType = 'REDONDO' | 'V';

export interface ValidationError {
  field: 'playerName' | 'playerNumber' | 'sizeName' | 'garmentType' | 'necklineType' | 'general';
  message: string;
  code: 
    | 'EMPTY_NAME'
    | 'EMPTY_NUMBER'
    | 'INVALID_CHARACTERS'
    | 'SIZE_NOT_FOUND'
    | 'INVALID_GARMENT_TYPE'
    | 'DUPLICATE_NUMBER'
    | 'DUPLICATE_ROW'
    | 'MISSING_DESIGN_ARTWORK'
    | 'MISSING_PATTERN_PIECES';
}

export interface ValidationWarning {
  field: 'playerName' | 'playerNumber' | 'sizeName' | 'garmentType' | 'general';
  message: string;
  code: 
    | 'EMPTY_NUMBER'
    | 'LONG_NAME'
    | 'NAME_TOO_SHORT'
    | 'NUMERIC_NAME'
    | 'SPECIAL_ACCENT'
    | 'NON_STANDARD_NUMBER';
}

export interface OrderItem {
  id: string;
  rowNumber: number;
  playerName: string;
  playerNumber: string;
  sizeName: string;
  garmentType: GarmentType;
  necklineType?: NecklineType;
  gender?: string;
  team?: string;
  notes?: string;
  quantity: number;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface OrderValidationConfig {
  availableSizes: string[];
  strictNumberUniqueness?: boolean;
  maxNameLengthWarn?: number; // Por defecto 14 caracteres
  allowSpecialCharacters?: boolean;
  activePatternSet?: any;
  activeDesign?: any;
  allPatternSets?: any[];
}

export interface OrderSummary {
  totalItems: number;
  validCount: number;
  invalidCount: number;
  hasErrors: boolean;
  totalPiecesCount: number; // Ej: Completo = 6 piezas, Camiseta = 4 piezas, Short = 2 piezas
  bySize: Record<string, number>;
  byGarmentType: Record<GarmentType, number>;
  warningCount: number;
}

export interface CsvExportOptions {
  delimiter: ',' | ';';
  includeBom: boolean; // UTF-8 BOM para Excel de Windows
  includeHeader: boolean;
}
