import initSqlJs, { Database } from 'sql.js';
import { INITIAL_SCHEMA_SQL } from './schema';

export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string | null = null;

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

    if (this.dbPath && nodeFs && typeof nodeFs.existsSync === 'function' && nodeFs.existsSync(this.dbPath)) {
      const fileBuffer = nodeFs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    // Ejecutar migraciones iniciales
    this.db.run(INITIAL_SCHEMA_SQL);

    // Si hay ruta de archivo, persistir estado inicial
    if (this.dbPath && nodeFs && typeof nodeFs.writeFileSync === 'function') {
      this.saveToDisk();
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
   * Ejecuta una sentencia SQL (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params: any[] = []): void {
    const db = this.getDb();
    db.run(sql, params);
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
   * Guarda el estado actual de la base de datos SQLite en disco
   */
  async saveToDisk(targetPath?: string): Promise<void> {
    if (typeof window !== 'undefined') return; // En navegador, SQLite se mantiene en memoria

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
