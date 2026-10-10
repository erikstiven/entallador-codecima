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

export interface ElectronEpsBridge {
  checkInkscape: (customPath?: string) => Promise<InkscapeDetectionResult>;
  convertSvgToEps: (params: {
    svgContent: string;
    options?: EpsConversionOptions;
    expectedDimensions?: { widthMm: number; heightMm: number };
  }) => Promise<EpsConversionResult>;
}

declare global {
  interface Window {
    electronEps?: ElectronEpsBridge;
  }
}

function getElectronEps(): ElectronEpsBridge | undefined {
  if (typeof window !== 'undefined' && window.electronEps) {
    return window.electronEps;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).electronEps) {
    return (globalThis as any).electronEps;
  }
  return undefined;
}

/**
 * Determina si la aplicación se está ejecutando dentro del entorno Electron con puente EPS.
 */
export function isElectronEpsAvailable(): boolean {
  return Boolean(getElectronEps()?.convertSvgToEps);
}

/**
 * Consulta la disponibilidad de Inkscape en el sistema a través del proceso principal de Electron.
 */
export async function checkInkscapeAvailability(
  customPath?: string
): Promise<InkscapeDetectionResult> {
  const bridge = getElectronEps();
  if (!bridge) {
    return {
      available: false,
      error:
        'La verificación y ejecución de Inkscape requiere la aplicación de escritorio Electron. En modo navegador web la exportación SVG y PDF continúan disponibles.',
    };
  }

  try {
    return await bridge.checkInkscape(customPath);
  } catch (err) {
    return {
      available: false,
      error: `Error al comunicar con el proceso principal de Electron: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Convierte el SVG maestro generado por CimaPattern a EPS mediante el motor Inkscape CLI en Electron.
 */
export async function convertSvgToEpsClient(
  svgContent: string,
  options?: EpsConversionOptions,
  expectedDimensions?: { widthMm: number; heightMm: number }
): Promise<EpsConversionResult> {
  const bridge = getElectronEps();
  if (!bridge) {
    return {
      success: false,
      error:
        'La conversión profesional a EPS mediante Inkscape CLI requiere ejecutar la aplicación de escritorio Electron. La exportación SVG de alta resolución continúa disponible.',
      warnings: [],
      executionTimeMs: 0,
    };
  }

  try {
    return await bridge.convertSvgToEps({
      svgContent,
      options,
      expectedDimensions,
    });
  } catch (err) {
    return {
      success: false,
      error: `Error durante la comunicación IPC para la conversión EPS: ${err instanceof Error ? err.message : String(err)}`,
      warnings: [],
      executionTimeMs: 0,
    };
  }
}
