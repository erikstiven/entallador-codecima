import { dbService } from '@/core/database/db';
import { useSystemSettingsStore, SystemSettings } from './systemSettingsStore';
import { useProfileStore, ProductionProfile } from './profileStore';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { useDesignStore } from '@/modules/designs/designStore';
import { getAllStoredCustomFonts, saveCustomFontToDb, restoreAndRegisterCustomFonts } from '@/core/fonts/fontRepository';

export interface StoredFontBackup {
  name: string;
  fileName: string;
  base64Buffer: string;
  uploadedAt: string;
}

export interface CimaTexBackupPayload {
  app: 'CimaTex PRO';
  version: '1.0';
  exportedAt: string;
  database: {
    sqliteBase64: string;
  };
  settings: SystemSettings;
  profiles: {
    list: ProductionProfile[];
    active: ProductionProfile | null;
  };
  customFonts?: StoredFontBackup[];
  metadata?: {
    patternSetsCount: number;
    designsCount: number;
    fontsCount: number;
  };
}

/**
 * Convierte un Uint8Array a cadena Base64 en bloques seguros
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Convierte una cadena Base64 a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Genera el paquete de respaldo completo del taller (.cimatex)
 */
export async function createCimaTexBackup(): Promise<CimaTexBackupPayload> {
  // 1. Exportar la base de datos SQLite activa (contiene moldes, diseños, piezas, etc.)
  const db = dbService.getDb();
  const dbBytes = db.export();
  const sqliteBase64 = uint8ArrayToBase64(dbBytes);

  // 2. Extraer configuración del sistema y perfiles de taller
  const settings = useSystemSettingsStore.getState().settings;
  const { profiles, activeProfile } = useProfileStore.getState();

  // 3. Extraer fuentes personalizadas guardadas
  const storedFonts = await getAllStoredCustomFonts();
  const fontsBackup: StoredFontBackup[] = storedFonts.map((f) => ({
    name: f.name,
    fileName: f.fileName,
    base64Buffer: uint8ArrayToBase64(new Uint8Array(f.buffer)),
    uploadedAt: f.uploadedAt,
  }));

  const patternSets = usePatternStore.getState().patternSets;
  const designs = useDesignStore.getState().designs;

  return {
    app: 'CimaTex PRO',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    database: {
      sqliteBase64,
    },
    settings,
    profiles: {
      list: profiles,
      active: activeProfile,
    },
    customFonts: fontsBackup,
    metadata: {
      patternSetsCount: patternSets.length,
      designsCount: designs.length,
      fontsCount: fontsBackup.length,
    },
  };
}

/**
 * Dispara la descarga del archivo de respaldo en el navegador
 */
export async function downloadCimaTexBackup(): Promise<string> {
  const payload = await createCimaTexBackup();
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `CIMATEX_BACKUP_${dateStr}.cimatex`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
}

/**
 * Lee y valida un archivo de respaldo .cimatex
 */
export async function parseBackupFile(file: File): Promise<CimaTexBackupPayload> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error('El archivo seleccionado no tiene un formato JSON válido.');
  }

  if (!parsed || parsed.app !== 'CimaTex PRO' || !parsed.database?.sqliteBase64) {
    throw new Error('El archivo no es un respaldo válido de CimaTex o está dañado.');
  }

  return parsed as CimaTexBackupPayload;
}

/**
 * Aplica y restaura el respaldo completo en la base de datos y almacenes
 */
export async function restoreCimaTexBackup(payload: CimaTexBackupPayload): Promise<void> {
  // 1. Restaurar la base de datos SQLite binaria
  const dbBytes = base64ToUint8Array(payload.database.sqliteBase64);

  // Guardar directamente en IndexedDB
  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    const IDB_NAME = 'hmb_entallador_db';
    const IDB_STORE = 'sqlite_storage';
    const IDB_KEY = 'sqlite_binary';

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(IDB_STORE)) {
          idb.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        const idb = req.result;
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(dbBytes, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // 2. Cerrar y reiniciar dbService con los nuevos bytes
  dbService.close();
  await dbService.initialize();

  // 3. Restaurar configuraciones del sistema
  if (payload.settings) {
    useSystemSettingsStore.getState().updateSettings(payload.settings);
  }

  // 4. Restaurar perfiles de marco de taller
  if (payload.profiles?.list && payload.profiles.list.length > 0) {
    const profileStore = useProfileStore.getState();
    for (const p of payload.profiles.list) {
      profileStore.addProfile(p);
    }
    if (payload.profiles.active) {
      profileStore.setActiveProfile(payload.profiles.active);
    }
  }

  // 5. Restaurar fuentes personalizadas
  if (payload.customFonts && payload.customFonts.length > 0) {
    for (const fontItem of payload.customFonts) {
      const buffer = base64ToUint8Array(fontItem.base64Buffer).buffer as ArrayBuffer;
      await saveCustomFontToDb(fontItem.name, fontItem.fileName, buffer);
    }
    await restoreAndRegisterCustomFonts();
  }

  // 6. Recargar moldes y diseños en memoria desde la base de datos recién restaurada
  await usePatternStore.getState().loadFromDatabase();
  await useDesignStore.getState().loadDesignsFromDatabase();
}
