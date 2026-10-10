import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { detectInkscape } from './services/inkscapeResolver'
import { convertSvgToEps } from './services/svgToEps'
import { EpsConversionOptions } from './services/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function setupIpcHandlers() {
  // Comprobar disponibilidad de Inkscape en el sistema
  ipcMain.handle('eps:check-inkscape', async (_event, customPath?: string) => {
    return await detectInkscape(customPath);
  });

  // Convertir SVG maestro a EPS Level 3 con validación
  ipcMain.handle(
    'eps:convert-svg',
    async (
      _event,
      params: {
        svgContent: string;
        options?: EpsConversionOptions;
        expectedDimensions?: { widthMm: number; heightMm: number };
      }
    ) => {
      const { svgContent, options, expectedDimensions } = params || {};
      return await convertSvgToEps(svgContent, options, expectedDimensions);
    }
  );
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'HMB Entallador — Sublimación Deportiva',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()
})
