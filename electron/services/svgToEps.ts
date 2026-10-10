import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { EpsConversionOptions, EpsConversionResult } from './types';
import { detectInkscape, INKSCAPE_NOT_FOUND_MESSAGE } from './inkscapeResolver';
import { validateEps } from './epsValidator';

const execFileAsync = promisify(execFile);

export interface SvgToEpsDependencies {
  execFn?: typeof execFileAsync;
  detectInkscapeFn?: typeof detectInkscape;
  mkdtempFn?: typeof fs.promises.mkdtemp;
  rmFn?: typeof fs.promises.rm;
}

/**
 * Convierte un contenido SVG completo a un archivo EPS Level 3 utilizando Inkscape CLI.
 */
export async function convertSvgToEps(
  svgContent: string,
  options: EpsConversionOptions = {},
  expectedDimensionsMm?: { widthMm: number; heightMm: number },
  deps: SvgToEpsDependencies = {}
): Promise<EpsConversionResult> {
  const startTime = Date.now();
  const execFn = deps.execFn || execFileAsync;
  const detectFn = deps.detectInkscapeFn || detectInkscape;
  const mkdtempFn = deps.mkdtempFn || fs.promises.mkdtemp;
  const rmFn = deps.rmFn || fs.promises.rm;

  const warnings: string[] = [];

  // 1. Validar parámetros de entrada
  if (!svgContent || typeof svgContent !== 'string' || !svgContent.trim()) {
    return {
      success: false,
      error: 'El contenido SVG de entrada está vacío o es inválido.',
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (!svgContent.includes('<svg')) {
    return {
      success: false,
      error: 'El contenido proporcionado no contiene una etiqueta raíz <svg válidamente formada.',
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 2. Localizar el ejecutable Inkscape
  const detection = await detectFn(options.customInkscapePath);
  if (!detection.available || !detection.executablePath) {
    return {
      success: false,
      error: detection.error || INKSCAPE_NOT_FOUND_MESSAGE,
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 3. Crear directorio temporal aislado
  let tempDir = '';
  try {
    tempDir = await mkdtempFn(path.join(os.tmpdir(), 'cima-eps-'));
  } catch (err) {
    return {
      success: false,
      error: `Error al crear el directorio temporal: ${err instanceof Error ? err.message : String(err)}`,
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  }

  const inputSvgPath = path.join(tempDir, 'master_input.svg');
  const outputEpsPath = path.join(tempDir, 'master_output.eps');

  try {
    // 4. Guardar SVG maestro temporalmente en UTF-8
    await fs.promises.writeFile(inputSvgPath, svgContent, 'utf8');

    // 5. Configurar argumentos de comando de forma segura
    const dpi = options.dpi && options.dpi >= 72 ? options.dpi : 300;
    const psLevel = options.postscriptLevel || 3;
    const timeoutMs = options.timeoutMs && options.timeoutMs > 1000 ? options.timeoutMs : 120000;

    const args: string[] = [
      inputSvgPath,
      `--export-filename=${outputEpsPath}`,
      '--export-area-page',
      '--export-text-to-path',
      `--export-ps-level=${psLevel}`,
      `--export-dpi=${dpi}`,
    ];

    // 6. Ejecutar Inkscape de forma segura con execFile (sin shell)
    await execFn(detection.executablePath, args, {
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
    });

    // 7. Verificar existencia del archivo generado
    if (!fs.existsSync(outputEpsPath)) {
      return {
        success: false,
        error: 'Inkscape finalizó su ejecución pero no se generó el archivo EPS esperado en el disco.',
        warnings,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 8. Leer contenido generado
    const epsBuffer = await fs.promises.readFile(outputEpsPath);
    const epsContent = epsBuffer.toString('utf8');

    // 9. Validación técnica del archivo EPS
    const validation = validateEps(epsContent, expectedDimensionsMm);
    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }

    if (!validation.isValid) {
      return {
        success: false,
        error: `El archivo EPS generado no superó la validación técnica: ${validation.errors.join('; ')}`,
        validation,
        warnings,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 10. Devolver resultado exitoso
    return {
      success: true,
      epsContent,
      validation,
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const errorMsg =
      err?.killed && err?.signal === 'SIGTERM'
        ? `La conversión a EPS superó el tiempo límite establecido (${(options.timeoutMs || 120000) / 1000}s).`
        : `Fallo durante la ejecución de Inkscape: ${err instanceof Error ? err.message : String(err)}`;

    return {
      success: false,
      error: errorMsg,
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    // 11. Limpieza de archivos temporales
    if (tempDir) {
      try {
        await rmFn(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.warn('[EpsConverter] Advertencia al eliminar directorio temporal:', cleanupErr);
      }
    }
  }
}
