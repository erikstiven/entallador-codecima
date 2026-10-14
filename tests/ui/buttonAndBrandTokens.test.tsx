import { describe, expect, it, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../../src/components/ui/Button';
import {
  useSystemSettingsStore,
  BRAND_PRIMARY_COLOR,
  BRAND_PRIMARY_HOVER,
  applyBrandColorToDom,
} from '../../src/modules/settings/systemSettingsStore';
import fs from 'fs';
import path from 'path';

// Mock localStorage para entorno de pruebas de Node/Vitest
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('TASK-1: Tokens CSS, Radio de Bordes y Sistema de Botón Configurable', () => {
  beforeEach(() => {
    storageMock.clear();
    useSystemSettingsStore.getState().resetSettings();
  });

  describe('Tokens y Reglas CSS en globals.css', () => {
    const cssPath = path.resolve(__dirname, '../../src/styles/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('define --radius: 0.5rem; en :root para el radio de bordes estándar', () => {
      expect(cssContent).toMatch(/--radius:\s*0\.5rem;/);
    });

    it('define variables de marca (--brand-primary, hover, light, text) en :root', () => {
      expect(cssContent).toMatch(/--brand-primary:\s*#7c3aed;/);
      expect(cssContent).toMatch(/--brand-primary-hover:\s*#6d28d9;/);
      expect(cssContent).toMatch(/--brand-primary-light:\s*#f5f3ff;/);
      expect(cssContent).toMatch(/--brand-primary-text:\s*#ffffff;/);
    });

    it('protege los textos de botones primarios frente a la regla html.light .text-white', () => {
      expect(cssContent).toContain('.btn-brand-primary');
      expect(cssContent).toContain('[data-variant="primary"]');
      expect(cssContent).toContain('[data-brand-btn]');
    });
  });

  describe('Componente Button reutilizable', () => {
    it('renderiza la variante primary por defecto con estilos de marca', () => {
      const html = renderToStaticMarkup(<Button>Guardar</Button>);
      expect(html).toContain('data-variant="primary"');
      expect(html).toContain('data-brand-btn="true"');
      expect(html).toContain('btn-brand-primary');
      expect(html).toContain('bg-brand-primary');
      expect(html).toContain('rounded-lg');
      expect(html).toContain('Guardar');
    });

    it('renderiza variantes secondary, destructive, ghost y outline correctamente', () => {
      const secHtml = renderToStaticMarkup(<Button variant="secondary">Cancelar</Button>);
      expect(secHtml).toContain('data-variant="secondary"');
      expect(secHtml).toContain('bg-white');
      expect(secHtml).toContain('border-slate-200');

      const destHtml = renderToStaticMarkup(<Button variant="destructive">Eliminar</Button>);
      expect(destHtml).toContain('data-variant="destructive"');
      expect(destHtml).toContain('bg-red-50');
      expect(destHtml).toContain('text-red-600');

      const ghostHtml = renderToStaticMarkup(<Button variant="ghost">Ver más</Button>);
      expect(ghostHtml).toContain('data-variant="ghost"');
      expect(ghostHtml).toContain('hover:bg-slate-100');

      const outlineHtml = renderToStaticMarkup(<Button variant="outline">Filtros</Button>);
      expect(outlineHtml).toContain('data-variant="outline"');
      expect(outlineHtml).toContain('border-slate-300');
    });

    it('soporta tamaños sm, md y lg', () => {
      const smHtml = renderToStaticMarkup(<Button size="sm">Pequeño</Button>);
      expect(smHtml).toContain('h-8');
      expect(smHtml).toContain('px-3');
      expect(smHtml).toContain('text-xs');

      const mdHtml = renderToStaticMarkup(<Button size="md">Medio</Button>);
      expect(mdHtml).toContain('h-9');
      expect(mdHtml).toContain('px-4');
      expect(mdHtml).toContain('text-sm');

      const lgHtml = renderToStaticMarkup(<Button size="lg">Grande</Button>);
      expect(lgHtml).toContain('h-10');
      expect(lgHtml).toContain('px-5');
    });

    it('maneja el estado isLoading deshabilitando el botón y mostrando spinner', () => {
      const loadingHtml = renderToStaticMarkup(<Button isLoading>Procesando</Button>);
      expect(loadingHtml).toContain('disabled=""');
      expect(loadingHtml).toContain('animate-spin');
    });
  });

  describe('Color de Marca Fijo del SaaS (Violeta Institucional CimaTex)', () => {
    it('define el color violeta institucional (#7c3aed y #6d28d9) coherente con la landing page', () => {
      expect(BRAND_PRIMARY_COLOR).toBe('#7c3aed');
      expect(BRAND_PRIMARY_HOVER).toBe('#6d28d9');
    });

    it('sincroniza las variables CSS de marca en documentElement', () => {
      const styles: Record<string, string> = {};
      const fakeDoc = {
        documentElement: {
          style: {
            setProperty: (prop: string, val: string) => {
              styles[prop] = val;
            },
          },
        },
      };

      (globalThis as any).document = fakeDoc;
      applyBrandColorToDom();
      expect(styles['--brand-primary']).toBe('#7c3aed');
      expect(styles['--brand-primary-hover']).toBe('#6d28d9');
      delete (globalThis as any).document;
    });
  });

  describe('Sincronización Header y Sidebar', () => {
    const sidebarPath = path.resolve(__dirname, '../../src/components/Sidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    it('tiene altura h-14 en el header de Sidebar coincidiendo con el Header principal', () => {
      expect(sidebarContent).toContain('h-14 px-3 border-b border-slate-100 flex items-center justify-between');
    });

    it('corrige la clase py-0.2 a py-0.5 en el badge del Sidebar', () => {
      expect(sidebarContent).not.toContain('py-0.2');
      expect(sidebarContent).toContain('py-0.5');
    });
  });
});
