import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { convertSvgToEps } from '../../electron/services/svgToEps';
import { INKSCAPE_NOT_FOUND_MESSAGE } from '../../electron/services/inkscapeResolver';

describe('Servicio svgToEps (Conversión SVG -> EPS con Inkscape CLI)', () => {
  const dummySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ff0000"/></svg>`;

  it('Rechaza entrada vacía o que no contiene etiqueta <svg', async () => {
    const resEmpty = await convertSvgToEps('');
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.error).toContain('vacío o es inválido');

    const resNoSvg = await convertSvgToEps('<html><body>No soy svg</body></html>');
    expect(resNoSvg.success).toBe(false);
    expect(resNoSvg.error).toContain('no contiene una etiqueta raíz <svg');
  });

  it('Retorna error amigable si Inkscape no está disponible', async () => {
    const mockDetect = async () => ({
      available: false,
      error: INKSCAPE_NOT_FOUND_MESSAGE,
    });

    const result = await convertSvgToEps(
      dummySvg,
      {},
      undefined,
      { detectInkscapeFn: mockDetect as any }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(INKSCAPE_NOT_FOUND_MESSAGE);
  });

  it('Ejecuta Inkscape con los argumentos correctos y limpia el directorio temporal', async () => {
    let capturedArgs: string[] = [];
    let capturedCmd = '';
    let tempDirCreated = '';
    let tempDirCleaned = false;

    const mockDetect = async () => ({
      available: true,
      executablePath: 'C:\\Program Files\\Inkscape\\bin\\inkscape.exe',
      version: 'Inkscape 1.3',
    });

    const mockMkdtemp = async (prefix: string) => {
      const dir = await fs.promises.mkdtemp(prefix);
      tempDirCreated = dir;
      return dir;
    };

    const mockRm = async (targetPath: string, opts: any) => {
      tempDirCleaned = true;
      return await fs.promises.rm(targetPath, opts);
    };

    const mockExec = async (cmd: string, args: string[]) => {
      capturedCmd = cmd;
      capturedArgs = args;

      // Extraer outputPath del argumento --export-filename
      const outArg = args.find((a) => a.startsWith('--export-filename='));
      if (outArg) {
        const outPath = outArg.replace('--export-filename=', '');
        const validEps = `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 283 283\n%%LanguageLevel: 3\n%%EOF\n`;
        await fs.promises.writeFile(outPath, validEps, 'utf8');
      }

      return { stdout: '', stderr: '' };
    };

    const result = await convertSvgToEps(
      dummySvg,
      { dpi: 300, postscriptLevel: 3 },
      { widthMm: 100, heightMm: 100 },
      {
        detectInkscapeFn: mockDetect as any,
        execFn: mockExec as any,
        mkdtempFn: mockMkdtemp as any,
        rmFn: mockRm as any,
      }
    );

    expect(result.success).toBe(true);
    expect(capturedCmd).toBe('C:\\Program Files\\Inkscape\\bin\\inkscape.exe');
    expect(capturedArgs).toContain('--export-area-page');
    expect(capturedArgs).toContain('--export-text-to-path');
    expect(capturedArgs).toContain('--export-ps-level=3');
    expect(capturedArgs).toContain('--export-dpi=300');
    expect(tempDirCleaned).toBe(true);
    expect(result.epsContent).toContain('%!PS-Adobe-3.0 EPSF-3.0');
    expect(result.validation?.isValid).toBe(true);
  });

  it('Maneja correctamente errores o excepciones durante la ejecución de Inkscape', async () => {
    const mockDetect = async () => ({
      available: true,
      executablePath: 'C:\\Program Files\\Inkscape\\bin\\inkscape.exe',
      version: 'Inkscape 1.3',
    });

    const mockExec = async () => {
      throw new Error('Proceso Inkscape falló con código 1');
    };

    const result = await convertSvgToEps(
      dummySvg,
      {},
      undefined,
      {
        detectInkscapeFn: mockDetect as any,
        execFn: mockExec as any,
      }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Fallo durante la ejecución de Inkscape');
  });
});
