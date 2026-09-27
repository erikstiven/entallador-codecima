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
            renderer(),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'node',
    },
  } as any;
})
