import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { InkscapeDetectionResult } from './types';

const execFileAsync = promisify(execFile);

export const INKSCAPE_NOT_FOUND_MESSAGE =
  'No se encontró Inkscape. Para exportar en formato EPS es necesario configurar el motor de conversión. La exportación SVG continúa disponible.';

/**
 * Lista de rutas estándar donde suele instalarse Inkscape según la plataforma.
 */
export function getStandardInkscapePaths(platform: string = process.platform): string[] {
  const candidates: string[] = [];

  if (platform === 'win32') {
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';

    candidates.push(
      path.join(programFiles, 'Inkscape', 'bin', 'inkscape.exe'),
      path.join(programFiles, 'Inkscape', 'inkscape.exe'),
      path.join(programFilesX86, 'Inkscape', 'bin', 'inkscape.exe'),
      path.join(programFilesX86, 'Inkscape', 'inkscape.exe')
    );

    if (localAppData) {
      candidates.push(
        path.join(localAppData, 'Programs', 'Inkscape', 'bin', 'inkscape.exe'),
        path.join(localAppData, 'Programs', 'Inkscape', 'inkscape.exe')
      );
    }
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Inkscape.app/Contents/MacOS/inkscape',
      '/opt/homebrew/bin/inkscape',
      '/usr/local/bin/inkscape'
    );
  } else {
    // Linux y BSD
    candidates.push(
      '/usr/bin/inkscape',
      '/usr/local/bin/inkscape',
      '/snap/bin/inkscape',
      '/var/lib/flatpak/exports/bin/org.inkscape.Inkscape'
    );
  }

  return candidates;
}

/**
 * Busca Inkscape en el PATH del sistema operativo.
 */
async function findInPath(
  platform: string,
  execFn: typeof execFileAsync
): Promise<string | null> {
  const cmd = platform === 'win32' ? 'where.exe' : 'which';
  try {
    const { stdout } = await execFn(cmd, ['inkscape'], { timeout: 3000 });
    const firstLine = stdout.trim().split(/\r?\n/)[0]?.trim();
    if (firstLine && fs.existsSync(firstLine)) {
      return firstLine;
    }
  } catch {
    // No encontrado en PATH
  }
  return null;
}

/**
 * Verifica la ejecución de Inkscape y extrae su versión mediante `--version`.
 */
async function testInkscapeExecutable(
  executablePath: string,
  execFn: typeof execFileAsync
): Promise<string | null> {
  try {
    const { stdout } = await execFn(executablePath, ['--version'], { timeout: 5000 });
    const versionMatch = stdout.trim().match(/Inkscape\s+([\d.]+[\w-]*)/i) || stdout.trim().match(/([\d.]+\w*)/);
    return versionMatch ? versionMatch[0] : stdout.trim().slice(0, 50);
  } catch {
    return null;
  }
}

export interface InkscapeResolverDependencies {
  execFn?: typeof execFileAsync;
  existsSyncFn?: typeof fs.existsSync;
  platform?: string;
}

/**
 * Localiza y valida el ejecutable de Inkscape en el entorno actual.
 */
export async function detectInkscape(
  customPath?: string,
  deps: InkscapeResolverDependencies = {}
): Promise<InkscapeDetectionResult> {
  const execFn = deps.execFn || execFileAsync;
  const existsFn = deps.existsSyncFn || fs.existsSync;
  const platform = deps.platform || process.platform;

  // 1. Verificar ruta personalizada si fue especificada
  if (customPath && customPath.trim()) {
    const trimmedPath = customPath.trim();
    if (existsFn(trimmedPath)) {
      const version = await testInkscapeExecutable(trimmedPath, execFn);
      if (version) {
        return {
          available: true,
          version,
          executablePath: trimmedPath,
        };
      }
      return {
        available: false,
        executablePath: trimmedPath,
        error: `La ruta configurada existe pero no responde al comando --version: ${trimmedPath}`,
      };
    }
    return {
      available: false,
      executablePath: trimmedPath,
      error: `La ruta configurada de Inkscape no existe en el sistema de archivos: ${trimmedPath}`,
    };
  }

  // 2. Verificar variable de entorno INKSCAPE_PATH
  const envPath = process.env.INKSCAPE_PATH;
  if (envPath && envPath.trim() && existsFn(envPath.trim())) {
    const version = await testInkscapeExecutable(envPath.trim(), execFn);
    if (version) {
      return {
        available: true,
        version,
        executablePath: envPath.trim(),
      };
    }
  }

  // 3. Buscar en el PATH global
  const pathResult = await findInPath(platform, execFn);
  if (pathResult && existsFn(pathResult)) {
    const version = await testInkscapeExecutable(pathResult, execFn);
    if (version) {
      return {
        available: true,
        version,
        executablePath: pathResult,
      };
    }
  }

  // 4. Buscar en rutas estándar conocidas
  const candidatePaths = getStandardInkscapePaths(platform);
  for (const candidate of candidatePaths) {
    if (existsFn(candidate)) {
      const version = await testInkscapeExecutable(candidate, execFn);
      if (version) {
        return {
          available: true,
          version,
          executablePath: candidate,
        };
      }
    }
  }

  // 5. No encontrado
  return {
    available: false,
    error: INKSCAPE_NOT_FOUND_MESSAGE,
  };
}
