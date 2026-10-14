import * as opentype from 'opentype.js';
import { registerOpentypeFont } from './fontManager';

const DB_NAME = 'cimatex_fonts_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_fonts';

export interface StoredFont {
  id: string;
  name: string;
  fileName: string;
  buffer: ArrayBuffer;
  uploadedAt: string;
}

function openFontDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

/**
 * Guarda un archivo de fuente (.ttf, .otf, .font) en IndexedDB para persistencia permanente tras F5
 */
export async function saveCustomFontToDb(
  name: string,
  fileName: string,
  buffer: ArrayBuffer
): Promise<void> {
  const db = await openFontDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const fontRecord: StoredFont = {
        id: name.trim().toLowerCase(),
        name: name.trim(),
        fileName,
        buffer,
        uploadedAt: new Date().toISOString(),
      };
      store.put(fontRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (_) {
      resolve();
    }
  });
}

/**
 * Obtiene todas las fuentes personalizadas guardadas en IndexedDB
 */
export async function getAllStoredCustomFonts(): Promise<StoredFont[]> {
  const db = await openFontDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredFont[]) || []);
      req.onerror = () => resolve([]);
    } catch (_) {
      resolve([]);
    }
  });
}

/**
 * Elimina una fuente personalizada de IndexedDB
 */
export async function deleteCustomFontFromDb(name: string): Promise<void> {
  const db = await openFontDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(name.trim().toLowerCase());
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (_) {
      resolve();
    }
  });
}

/**
 * Restaura automáticamente todas las fuentes subidas por el usuario guardadas en IndexedDB
 * y las registra en el gestor de fuentes (fontManager) para su uso en curvas vectoriales.
 */
export async function restoreAndRegisterCustomFonts(): Promise<string[]> {
  const stored = await getAllStoredCustomFonts();
  const registeredNames: string[] = [];
  for (const item of stored) {
    try {
      const font = opentype.parse(item.buffer);
      registerOpentypeFont(item.name, font);
      registeredNames.push(item.name);
    } catch (err) {
      console.warn(`Error al restaurar tipografía "${item.name}":`, err);
    }
  }
  return registeredNames;
}
