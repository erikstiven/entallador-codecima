import initSqlJs, { Database } from 'sql.js';
import { INITIAL_SCHEMA_SQL } from './schema';
import fs from 'node:fs';
import path from 'node:path';

export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string | null = null;

  /**
   * Inicializa la base de datos SQLite y ejecuta las migraciones iniciales
   */
  async initialize(dbFilePath?: string): Promise<Database> {
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        try {
          if (typeof window !== 'undefined') {
            return `/${file}`;
          }
          const wasmPath = path.resolve(process.cwd(), 'node_modules/sql.js/dist', file);
          if (fs.existsSync && fs.existsSync(wasmPath)) {
            return wasmPath;
          }
        } catch (_) {}
        return file;
      },
    });

    this.dbPath = dbFilePath || null;

    if (this.dbPath && typeof fs.existsSync === 'function' && fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    // Ejecutar migraciones iniciales
    this.db.run(INITIAL_SCHEMA_SQL);

    // Si hay ruta de archivo, persistir estado inicial
    if (this.dbPath && typeof fs.writeFileSync === 'function') {
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
  saveToDisk(targetPath?: string): void {
    const savePath = targetPath || this.dbPath;
    if (!savePath) return;

    const db = this.getDb();
    const data = db.export();
    const buffer = Buffer.from(data);

    // Asegurar directorio padre
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(savePath, buffer);
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
