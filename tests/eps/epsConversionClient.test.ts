import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isElectronEpsAvailable,
  checkInkscapeAvailability,
  convertSvgToEpsClient,
} from '../../src/modules/export/epsConversionClient';

describe('Cliente epsConversionClient (Renderer Bridge)', () => {
  beforeEach(() => {
    delete (globalThis as any).electronEps;
  });

  afterEach(() => {
    delete (globalThis as any).electronEps;
  });

  it('Detecta que Electron no está disponible si window.electronEps no existe', () => {
    expect(isElectronEpsAvailable()).toBe(false);
  });

  it('Informa mensaje descriptivo cuando se intenta comprobar Inkscape en entorno web', async () => {
    const res = await checkInkscapeAvailability();
    expect(res.available).toBe(false);
    expect(res.error).toContain('requiere la aplicación de escritorio Electron');
  });

  it('Informa mensaje descriptivo cuando se intenta convertir SVG en entorno web', async () => {
    const res = await convertSvgToEpsClient('<svg></svg>');
    expect(res.success).toBe(false);
    expect(res.error).toContain('requiere ejecutar la aplicación de escritorio Electron');
  });

  it('Llama al puente window.electronEps cuando está presente', async () => {
    let calledWithSvg = '';
    (globalThis as any).electronEps = {
      checkInkscape: async () => ({
        available: true,
        version: 'Inkscape 1.3',
        executablePath: 'C:\\Program Files\\Inkscape\\bin\\inkscape.exe',
      }),
      convertSvgToEps: async (params: any) => {
        calledWithSvg = params.svgContent;
        return {
          success: true,
          epsContent: '%!PS-Adobe-3.0 EPSF-3.0\n%%EOF',
          warnings: [],
          executionTimeMs: 15,
        };
      },
    };

    expect(isElectronEpsAvailable()).toBe(true);

    const checkRes = await checkInkscapeAvailability();
    expect(checkRes.available).toBe(true);
    expect(checkRes.version).toBe('Inkscape 1.3');

    const convertRes = await convertSvgToEpsClient('<svg id="test"></svg>');
    expect(convertRes.success).toBe(true);
    expect(calledWithSvg).toBe('<svg id="test"></svg>');
    expect(convertRes.epsContent).toContain('%!PS-Adobe-3.0 EPSF-3.0');
  });
});
