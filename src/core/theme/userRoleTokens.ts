/**
 * Tokens y Utilidades de Tipos de Usuario (Roles)
 * Centraliza la definición de colores y estilos en src/styles/globals.css
 * evitando cualquier valor hardcodeado en los componentes de la interfaz.
 */

export type UserRoleKey = 'admin' | 'operator' | 'designer' | 'auditor' | 'default';

export interface UserRoleTheme {
  key: UserRoleKey;
  label: string;
  badgeClass: string;
  textClass: string;
  avatarClass: string;
  cssVarPrefix: string;
}

export const USER_ROLE_THEMES: Record<UserRoleKey, UserRoleTheme> = {
  admin: {
    key: 'admin',
    label: 'ADMINISTRADOR',
    badgeClass: 'role-badge-admin',
    textClass: 'role-text-admin',
    avatarClass: 'role-avatar-admin',
    cssVarPrefix: '--role-admin',
  },
  operator: {
    key: 'operator',
    label: 'OPERADOR',
    badgeClass: 'role-badge-operator',
    textClass: 'role-text-operator',
    avatarClass: 'role-avatar-operator',
    cssVarPrefix: '--role-operator',
  },
  designer: {
    key: 'designer',
    label: 'DISEÑADOR',
    badgeClass: 'role-badge-designer',
    textClass: 'role-text-designer',
    avatarClass: 'role-avatar-designer',
    cssVarPrefix: '--role-designer',
  },
  auditor: {
    key: 'auditor',
    label: 'AUDITOR',
    badgeClass: 'role-badge-auditor',
    textClass: 'role-text-auditor',
    avatarClass: 'role-avatar-auditor',
    cssVarPrefix: '--role-auditor',
  },
  default: {
    key: 'default',
    label: 'USUARIO',
    badgeClass: 'role-badge-default',
    textClass: 'role-text-default',
    avatarClass: 'role-avatar-default',
    cssVarPrefix: '--role-default',
  },
};

/**
 * Normaliza y resuelve el tema visual correspondiente a un rol de usuario dado.
 * Maneja mayúsculas, minúsculas, acentos y variaciones lingüísticas comunes.
 */
export function getRoleTheme(role?: string | null): UserRoleTheme {
  if (!role || typeof role !== 'string') {
    return USER_ROLE_THEMES.admin;
  }

  const normalized = role.trim().toUpperCase();

  if (normalized.includes('ADMIN')) {
    return USER_ROLE_THEMES.admin;
  }
  if (
    normalized.includes('OPER') || 
    normalized.includes('TALLER') || 
    normalized.includes('CORTE') ||
    normalized.includes('PRODUCC')
  ) {
    return USER_ROLE_THEMES.operator;
  }
  if (
    normalized.includes('DISEN') || 
    normalized.includes('DISEÑ') || 
    normalized.includes('ARTE') ||
    normalized.includes('GRAFIC')
  ) {
    return USER_ROLE_THEMES.designer;
  }
  if (
    normalized.includes('AUDIT') || 
    normalized.includes('SUPERV') || 
    normalized.includes('CALIDAD')
  ) {
    return USER_ROLE_THEMES.auditor;
  }

  return USER_ROLE_THEMES.default;
}

/**
 * Retorna todos los temas de roles registrados en el sistema.
 */
export function getAllRoleThemes(): UserRoleTheme[] {
  return Object.values(USER_ROLE_THEMES);
}
