import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig(() => {
  const isTest = process.env.VITEST !== undefined;

  return {
    plugins: [
      react(),
      ...(!isTest
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
    test: {
      globals: true,
      environment: 'node',
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
