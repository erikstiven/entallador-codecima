import { describe, it, expect } from 'vitest';
import {
  detectInkscape,
  getStandardInkscapePaths,
  INKSCAPE_NOT_FOUND_MESSAGE,
} from '../../electron/services/inkscapeResolver';

describe('Servicio inkscapeResolver (Detección de Inkscape CLI)', () => {
  it('Retorna rutas estándar esperadas para win32, darwin y linux', () => {
    const winPaths = getStandardInkscapePaths('win32');
    expect(winPaths.some((p) => p.includes('Inkscape\\bin\\inkscape.exe'))).toBe(true);

    const macPaths = getStandardInkscapePaths('darwin');
    expect(macPaths.some((p) => p.includes('Inkscape.app'))).toBe(true);

    const linuxPaths = getStandardInkscapePaths('linux');
    expect(linuxPaths.some((p) => p.includes('/usr/bin/inkscape'))).toBe(true);
  });

  it('Detecta Inkscape con éxito cuando la ruta personalizada existe y responde a --version', async () => {
    const mockExec = async (cmd: string, args: string[]) => {
      expect(args).toEqual(['--version']);
      return { stdout: 'Inkscape 1.3.2 (091e20e, 2023-11-25)\n', stderr: '' };
    };
    const mockExists = (pathToCheck: string) => pathToCheck === 'C:\\Custom\\inkscape.exe';

    const result = await detectInkscape('C:\\Custom\\inkscape.exe', {
      execFn: mockExec as any,
      existsSyncFn: mockExists as any,
      platform: 'win32',
    });

    expect(result.available).toBe(true);
    expect(result.executablePath).toBe('C:\\Custom\\inkscape.exe');
    expect(result.version).toContain('Inkscape 1.3.2');
  });

  it('Devuelve error específico si la ruta personalizada no existe en el sistema de archivos', async () => {
    const mockExists = () => false;

    const result = await detectInkscape('C:\\Inexistente\\inkscape.exe', {
      existsSyncFn: mockExists as any,
      platform: 'win32',
    });

    expect(result.available).toBe(false);
    expect(result.error).toContain('La ruta configurada de Inkscape no existe');
  });

  it('Devuelve error específico si la ruta personalizada existe pero falla al ejecutar --version', async () => {
    const mockExec = async () => {
      throw new Error('Command failed: inkscape --version');
    };
    const mockExists = () => true;

    const result = await detectInkscape('C:\\Corrupt\\inkscape.exe', {
      execFn: mockExec as any,
      existsSyncFn: mockExists as any,
      platform: 'win32',
    });

    expect(result.available).toBe(false);
    expect(result.error).toContain('no responde al comando --version');
  });

  it('Retorna mensaje estándar de no encontrado si ningún ejecutable está disponible', async () => {
    const mockExists = () => false;
    const mockExec = async () => {
      throw new Error('Not found');
    };

    const result = await detectInkscape(undefined, {
      execFn: mockExec as any,
      existsSyncFn: mockExists as any,
      platform: 'win32',
    });

    expect(result.available).toBe(false);
    expect(result.error).toBe(INKSCAPE_NOT_FOUND_MESSAGE);
  });
});
