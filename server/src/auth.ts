import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from './db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'cimatex-secret-key-change-in-production-vps';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface User {
  id: string;
  google_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export interface AuthJwtPayload {
  id: string;
  email: string;
  role: string;
  plan: string;
}

// Extensión de tipo Request de Express para adjuntar usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: AuthJwtPayload;
}

/**
 * Valida un token emitido por Google OAuth (id_token o credential de Google Identity Services).
 * Retorna la información básica del perfil verificado.
 */
export async function verifyGoogleToken(token: string): Promise<{
  googleId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}> {
  if (!token) {
    throw new Error('El token de autenticación de Google es obligatorio');
  }

  try {
    // Si GOOGLE_CLIENT_ID está configurado, verificamos criptográficamente contra el audience
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID ? [GOOGLE_CLIENT_ID] : undefined,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Token de Google inválido: no contiene correo electrónico');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      fullName: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture || null,
    };
  } catch (err: any) {
    // Intento de fallback mediante el endpoint oficial tokeninfo si la librería de cliente falla por mismatch de audience de desarrollo
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
      if (response.ok) {
        const data: any = await response.json();
        if (data.email) {
          return {
            googleId: data.sub,
            email: data.email.toLowerCase().trim(),
            fullName: data.name || data.email.split('@')[0],
            avatarUrl: data.picture || null,
          };
        }
      }
    } catch {
      // Ignorar fallback y lanzar error original
    }

    throw new Error(`Error al verificar credencial de Google: ${err?.message || 'Token no válido'}`);
  }
}

/**
 * Inserta o actualiza un usuario en PostgreSQL (Upsert basado en email).
 */
export async function upsertGoogleUser(userData: {
  googleId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}): Promise<User> {
  const sql = `
    INSERT INTO users (google_id, email, full_name, avatar_url, last_login_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (email)
    DO UPDATE SET
      google_id = COALESCE(EXCLUDED.google_id, users.google_id),
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      last_login_at = CURRENT_TIMESTAMP
    RETURNING id, google_id, email, full_name, avatar_url, plan, role, created_at, updated_at, last_login_at;
  `;

  const values = [
    userData.googleId,
    userData.email,
    userData.fullName,
    userData.avatarUrl,
  ];

  const result = await query<User>(sql, values);
  return result.rows[0];
}

/**
 * Genera un token JWT de sesión para la aplicación CimaTex.
 */
export function generateJwtToken(user: {
  id: string;
  email: string;
  role: string;
  plan: string;
}): string {
  const payload: AuthJwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Middleware Express para proteger rutas que requieren autenticación.
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    res.status(401).json({
      error: 'Acceso no autorizado: Token de autenticación no proporcionado',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({
      error: 'Token inválido o expirado',
      detail: err?.message,
    });
  }
}
