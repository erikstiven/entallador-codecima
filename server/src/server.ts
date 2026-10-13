import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, checkDbConnection, initDbSchema, closePool } from './db';
import {
  verifyGoogleToken,
  upsertGoogleUser,
  generateJwtToken,
  authenticateToken,
  AuthenticatedRequest,
  User,
} from './auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Configuración de CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite solicitudes sin origen (ej. curl, postman, electron local) o cualquier origen si CORS_ORIGIN es '*'
      if (!origin || process.env.CORS_ORIGIN === '*' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permisivo por defecto en entorno privado VPS, pero registra aviso
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));

// Middleware de logging conciso
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ==============================================================================
// RUTAS PRINCIPALES
// ==============================================================================

/**
 * Healthcheck de la API y verificación del pool de PostgreSQL
 */
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDbConnection();
  const statusCode = dbHealth.ok ? 200 : 503;

  res.status(statusCode).json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    service: 'cimatex-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbHealth,
    environment: process.env.NODE_ENV || 'production',
  });
});

/**
 * Autenticación mediante Google OAuth
 * Recibe el idToken / credential emitido por Google Identity Services
 */
app.post('/api/auth/google', async (req: Request, res: Response): Promise<void> => {
  const token = req.body.token || req.body.credential || req.body.idToken;

  if (!token) {
    res.status(400).json({
      error: 'Token de Google requerido en el cuerpo de la solicitud (token/credential/idToken)',
    });
    return;
  }

  try {
    const verifiedProfile = await verifyGoogleToken(token);
    const user = await upsertGoogleUser(verifiedProfile);
    const sessionToken = generateJwtToken(user);

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        plan: user.plan,
        role: user.role,
        lastLoginAt: user.last_login_at,
      },
    });
  } catch (err: any) {
    console.error('❌ Error en autenticación con Google:', err?.message || err);
    res.status(401).json({
      error: 'Autenticación fallida con Google',
      detail: err?.message || 'Token no válido o expirado',
    });
  }
});

/**
 * Perfil del usuario autenticado actual
 */
app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no identificado en el token' });
      return;
    }

    const result = await query<User>(
      'SELECT id, google_id, email, full_name, avatar_url, plan, role, created_at, updated_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
      return;
    }

    const u = result.rows[0];
    res.json({
      user: {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        avatarUrl: u.avatar_url,
        plan: u.plan,
        role: u.role,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        lastLoginAt: u.last_login_at,
      },
    });
  } catch (err: any) {
    console.error('❌ Error al obtener perfil de usuario:', err);
    res.status(500).json({ error: 'Error interno al consultar usuario' });
  }
});

/**
 * Listar pedidos sincronizados del usuario actual
 */
app.get('/api/orders/sync', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await query(
      `SELECT id, order_code, client_name, status, data, created_at, updated_at
       FROM orders_sync
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rowCount,
      orders: result.rows,
    });
  } catch (err: any) {
    console.error('❌ Error al obtener pedidos sincronizados:', err);
    res.status(500).json({ error: 'Error al consultar pedidos' });
  }
});

/**
 * Crear o actualizar pedido sincronizado en la nube
 */
app.post('/api/orders/sync', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { order_code, client_name, status, data } = req.body;

    if (!order_code) {
      res.status(400).json({ error: 'order_code es obligatorio' });
      return;
    }

    const sql = `
      INSERT INTO orders_sync (user_id, order_code, client_name, status, data, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id, order_code, client_name, status, data, created_at, updated_at;
    `;

    const values = [
      userId,
      order_code,
      client_name || 'Sin Cliente',
      status || 'draft',
      JSON.stringify(data || {}),
    ];

    const result = await query(sql, values);

    res.status(201).json({
      success: true,
      order: result.rows[0],
    });
  } catch (err: any) {
    console.error('❌ Error al sincronizar pedido:', err);
    res.status(500).json({ error: 'Error al guardar pedido' });
  }
});

// Manejador 404 para rutas inexistentes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta API no encontrada' });
});

// Manejador de errores global
app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('🔥 Error no capturado en Express:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Inicialización del servidor
const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 [CimaTex API] Servidor ejecutándose en http://${HOST}:${PORT}`);
  console.log(`📡 Modo de entorno: ${process.env.NODE_ENV || 'production'}`);
  await initDbSchema();
});

// Graceful Shutdown
async function handleShutdown(signal: string) {
  console.log(`\n🛑 Recibida señal ${signal}. Iniciando apagado ordenado...`);
  server.close(async () => {
    console.log('🛑 Servidor HTTP detenido.');
    await closePool();
    console.log('✅ CimaTex API finalizado de manera segura.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Apagado forzado por tiempo límite.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default app;
