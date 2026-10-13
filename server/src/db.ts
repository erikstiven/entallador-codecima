import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const portNumber = parseInt(process.env.DB_PORT || '5432', 10);

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'cimatex_postgres',
  port: Number.isNaN(portNumber) ? 5432 : portNumber,
  user: process.env.DB_USER || 'cimatex_user',
  password: process.env.DB_PASSWORD || 'cimatex_pass',
  database: process.env.DB_NAME || 'cimatex_db',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Si se define DATABASE_URL directa (ej. en ciertos hosts o proxies), se prioriza
if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
}

// Configuración de SSL opcional para producción
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
  };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

/**
 * Ejecuta una consulta SQL en el pool de conexiones.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] Consulta ejecutada en ${duration}ms:`, { text, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('[DB] Error ejecutando consulta:', { text, error });
    throw error;
  }
}

/**
 * Healthcheck activo de la base de datos midiendo latencia en milisegundos.
 */
export async function checkDbConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1 AS healthcheck');
    return {
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err?.message || 'Error desconocido al conectar con PostgreSQL',
    };
  }
}

/**
 * Inicializa el esquema de base de datos de manera idempotente leyendo `server/db/schema.sql`.
 * Garantiza que las tablas existan al levantar el servidor Node.
 */
export async function initDbSchema(): Promise<void> {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    try {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(sql);
      console.log('✅ Esquema PostgreSQL inicializado / verificado correctamente.');
    } catch (err) {
      console.error('⚠️ Advertencia: No se pudo ejecutar el script de esquema automático:', err);
    }
  }
}

/**
 * Cierre limpio del pool para Graceful Shutdown.
 */
export async function closePool(): Promise<void> {
  console.log('🔌 Cerrando pool de conexiones PostgreSQL...');
  await pool.end();
  console.log('🔌 Pool cerrado con éxito.');
}
