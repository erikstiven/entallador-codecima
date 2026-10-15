import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isTest = process.env.VITEST !== undefined;
  const isWeb = mode === 'web';

  return {
    plugins: [
      react(),
      ...(!isTest && !isWeb
        ? [
            electron([
              { entry: 'electron/main.ts' },
              {
                entry: 'electron/preload.ts',
                onstart(options) {
                  options.reload()
                },
              },
            ]),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    worker: {
      format: 'es',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('svg2pdf.js')) {
                return 'vendor-pdf';
              }
              if (id.includes('xlsx') || id.includes('exceljs')) {
                return 'vendor-excel';
              }
              if (id.includes('sql.js')) {
                return 'vendor-db';
              }
              if (id.includes('opentype.js')) {
                return 'vendor-fonts';
              }
              if (id.includes('clipper2-wasm')) {
                return 'vendor-geometry';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
                return 'vendor-framework';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
    test: {
      globals: true,
      environment: 'node',
      maxWorkers: 2,
      // svg2pdf.js solo registra jsPDF.API.svg al cargarse: su build UMD busca
      // window.jsPDF (inexistente en Node). Inlinándolo, Vitest lo empaqueta con
      // Vite y usa el entrypoint ESM que importa jspdf directamente.
      server: {
        deps: {
          inline: ['svg2pdf.js'],
        },
      },
    },
  } as any;
})
