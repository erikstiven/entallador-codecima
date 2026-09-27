import { ipcRenderer, contextBridge } from 'electron'

// Expose safe APIs to the renderer
window.addEventListener('DOMContentLoaded', () => {
  console.log('HMB Entallador Preload Script initialized.')
})
