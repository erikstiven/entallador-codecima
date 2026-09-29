import initSqlJs, { Database } from 'sql.js';
import { INITIAL_SCHEMA_SQL } from './schema';

const IDB_NAME = 'hmb_entallador_db';
const IDB_STORE = 'sqlite_storage';
const IDB_KEY = 'sqlite_binary';

function openIndexedDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

async function loadDbFromIndexedDb(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDb();
    if (!idb) return null;
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_KEY);
        req.onsuccess = () => {
          const result = req.result;
          if (result instanceof Uint8Array) {
            resolve(result);
          } else if (result instanceof ArrayBuffer) {
            resolve(new Uint8Array(result));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  } catch (_) {
    return null;
  }
}

async function saveDbToIndexedDb(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIndexedDb();
    if (!idb) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(data, IDB_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.error('Error guardando en IndexedDB:', err);
  }
}

export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string | null = null;
  private saveDebounceTimer: any = null;

  /**
   * Inicializa la base de datos SQLite y ejecuta las migraciones iniciales
   */
  async initialize(dbFilePath?: string): Promise<Database> {
    const isBrowser = typeof window !== 'undefined';
    let nodeFs: any = null;
    let nodePath: any = null;

    if (!isBrowser) {
      try {
        nodeFs = await import('node:fs');
        nodePath = await import('node:path');
      } catch (_) {}
    }

    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (isBrowser) {
          return `/${file}`;
        }
        try {
          if (nodePath && nodeFs) {
            const wasmPath = nodePath.resolve(process.cwd(), 'node_modules/sql.js/dist', file);
            if (nodeFs.existsSync(wasmPath)) {
              return wasmPath;
            }
          }
        } catch (_) {}
        return file;
      },
    });

    this.dbPath = dbFilePath || null;

    let loadedFromStorage = false;
    if (isBrowser) {
      const savedBytes = await loadDbFromIndexedDb();
      if (savedBytes && savedBytes.length > 0) {
        try {
          this.db = new SQL.Database(savedBytes);
          loadedFromStorage = true;
        } catch (e) {
          console.warn('No se pudo restaurar base de datos previa de IndexedDB:', e);
        }
      }
    }

    if (!this.db) {
      if (this.dbPath && nodeFs && typeof nodeFs.existsSync === 'function' && nodeFs.existsSync(this.dbPath)) {
        const fileBuffer = nodeFs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }
    }

    // Ejecutar migraciones iniciales de manera idempotente
    this.db.run(INITIAL_SCHEMA_SQL);

    // Si hay ruta de archivo, persistir estado inicial
    if (this.dbPath && nodeFs && typeof nodeFs.writeFileSync === 'function') {
      this.saveToDisk();
    } else if (isBrowser && !loadedFromStorage) {
      this.persistBrowserDb();
    }

    return this.db;
  }

  /**
   * Retorna la instancia activa de la base de datos
   */
  getDb(): Database {
    if (!this.db) {
      throw new Error('DatabaseService: La base de datos no ha sido inicializada.');
    }
    return this.db;
  }

  /**
   * Ejecuta una sentencia SQL (INSERT, UPDATE, DELETE, REPLACE)
   */
  run(sql: string, params: any[] = []): void {
    const db = this.getDb();
    db.run(sql, params);

    // Auto-guardar en IndexedDB si la consulta modifica datos en el navegador
    const upper = sql.trim().toUpperCase();
    if (
      upper.startsWith('INSERT') ||
      upper.startsWith('UPDATE') ||
      upper.startsWith('DELETE') ||
      upper.startsWith('REPLACE')
    ) {
      this.scheduleAutoSave();
    }
  }

  /**
   * Programa el auto-guardado en IndexedDB con debounce para alto rendimiento
   */
  scheduleAutoSave(): void {
    if (typeof window === 'undefined') return;
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.persistBrowserDb();
    }, 200);
  }

  /**
   * Exporta y persiste de forma inmediata la base de datos completa en IndexedDB
   */
  async persistBrowserDb(): Promise<void> {
    if (typeof window === 'undefined' || !this.db) return;
    try {
      const data = this.db.export();
      await saveDbToIndexedDb(data);
    } catch (e) {
      console.error('Error persistiendo SQLite en IndexedDB:', e);
    }
  }

  /**
   * Ejecuta una consulta SELECT y retorna un array de objetos tipados
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  /**
   * Retorna el primer registro o null
   */
  queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const rows = this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Guarda el estado actual de la base de datos SQLite en disco o en IndexedDB
   */
  async saveToDisk(targetPath?: string): Promise<void> {
    if (typeof window !== 'undefined') {
      await this.persistBrowserDb();
      return;
    }

    const savePath = targetPath || this.dbPath;
    if (!savePath) return;

    try {
      const nodeFs = await import('node:fs');
      const nodePath = await import('node:path');
      const db = this.getDb();
      const data = db.export();
      const buffer = Buffer.from(data);

      const dir = nodePath.dirname(savePath);
      if (!nodeFs.existsSync(dir)) {
        nodeFs.mkdirSync(dir, { recursive: true });
      }

      nodeFs.writeFileSync(savePath, buffer);
    } catch (_) {}
  }

  /**
   * Cierra la conexión de base de datos
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instancia singleton para uso en la aplicación
export const dbService = new DatabaseService();
