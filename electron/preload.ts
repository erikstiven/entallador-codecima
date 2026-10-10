import { ipcRenderer, contextBridge } from 'electron'
import type { EpsConversionOptions, EpsConversionResult, InkscapeDetectionResult } from './services/types'

const electronEps = {
  checkInkscape: (customPath?: string): Promise<InkscapeDetectionResult> => {
    return ipcRenderer.invoke('eps:check-inkscape', customPath)
  },
  convertSvgToEps: (params: {
    svgContent: string
    options?: EpsConversionOptions
    expectedDimensions?: { widthMm: number; heightMm: number }
  }): Promise<EpsConversionResult> => {
    return ipcRenderer.invoke('eps:convert-svg', params)
  },
}

try {
  contextBridge.exposeInMainWorld('electronEps', electronEps)
} catch {
  // En caso de contextIsolation: false
}

// Soporte para entornos donde contextIsolation sea false o true
;(window as any).electronEps = electronEps

window.addEventListener('DOMContentLoaded', () => {
  console.log('HMB Entallador Preload Script initialized with EPS engine.')
})
