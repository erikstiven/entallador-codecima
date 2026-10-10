export interface InkscapeDetectionResult {
  available: boolean;
  version?: string;
  executablePath?: string;
  error?: string;
}

export interface EpsConversionOptions {
  dpi?: number;
  postscriptLevel?: 3;
  convertTextToPaths?: boolean;
  timeoutMs?: number;
  customInkscapePath?: string;
}

export interface EpsBoundingBox {
  llx: number;
  lly: number;
  urx: number;
  ury: number;
  widthPt: number;
  heightPt: number;
  isHiRes?: boolean;
}

export interface EpsValidationResult {
  isValid: boolean;
  boundingBox?: EpsBoundingBox;
  warnings: string[];
  errors: string[];
  fileSizeBytes: number;
  postscriptLevel?: number;
}

export interface EpsConversionResult {
  success: boolean;
  epsContent?: string;
  validation?: EpsValidationResult;
  warnings: string[];
  error?: string;
  executionTimeMs: number;
}
