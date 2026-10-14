import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRoleTheme, USER_ROLE_THEMES, getAllRoleThemes } from '../../src/core/theme/userRoleTokens';

describe('Sistema de Tokens y Estilos para Tipos de Usuario (Sin Hardcoding)', () => {
  const globalsCssPath = path.resolve(__dirname, '../../src/styles/globals.css');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');
  const headerPath = path.resolve(__dirname, '../../src/components/Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  describe('1. Archivo de Estilos (globals.css)', () => {
    it('define variables CSS en :root para cada tipo de usuario', () => {
      expect(globalsCss).toContain('--role-admin-bg: #eff6ff;');
      expect(globalsCss).toContain('--role-admin-text: #1d4ed8;');
      expect(globalsCss).toContain('--role-admin-border: #bfdbfe;');

      expect(globalsCss).toContain('--role-operator-bg: #ecfdf5;');
      expect(globalsCss).toContain('--role-operator-text: #047857;');
      expect(globalsCss).toContain('--role-operator-border: #a7f3d0;');

      expect(globalsCss).toContain('--role-designer-bg: #f5f3ff;');
      expect(globalsCss).toContain('--role-designer-text: #6d28d9;');
      expect(globalsCss).toContain('--role-designer-border: #ddd6fe;');

      expect(globalsCss).toContain('--role-auditor-bg: #fffbeb;');
      expect(globalsCss).toContain('--role-auditor-text: #b45309;');
      expect(globalsCss).toContain('--role-auditor-border: #fde68a;');

      expect(globalsCss).toContain('--role-default-bg: #f1f5f9;');
      expect(globalsCss).toContain('--role-default-text: #334155;');
      expect(globalsCss).toContain('--role-default-border: #cbd5e1;');
    });

    it('define clases semánticas para badges, textos y avatares según rol', () => {
      expect(globalsCss).toContain('.role-badge-admin');
      expect(globalsCss).toContain('.role-badge-operator');
      expect(globalsCss).toContain('.role-badge-designer');
      expect(globalsCss).toContain('.role-badge-auditor');
      expect(globalsCss).toContain('.role-badge-default');

      expect(globalsCss).toContain('.role-text-admin');
      expect(globalsCss).toContain('.role-text-operator');
      expect(globalsCss).toContain('.role-text-designer');
      expect(globalsCss).toContain('.role-text-auditor');

      expect(globalsCss).toContain('.role-avatar-admin');
      expect(globalsCss).toContain('.role-avatar-operator');
      expect(globalsCss).toContain('.role-avatar-designer');
      expect(globalsCss).toContain('.role-avatar-auditor');
    });
  });

  describe('2. Módulo de Tokens (userRoleTokens.ts)', () => {
    it('resuelve correctamente temas para ADMINISTRADOR', () => {
      const theme = getRoleTheme('ADMINISTRADOR');
      expect(theme.key).toBe('admin');
      expect(theme.badgeClass).toBe('role-badge-admin');
      expect(theme.textClass).toBe('role-text-admin');
      expect(theme.avatarClass).toBe('role-avatar-admin');
    });

    it('resuelve correctamente temas para OPERADOR y variantes', () => {
      expect(getRoleTheme('OPERADOR').key).toBe('operator');
      expect(getRoleTheme('operario taller').key).toBe('operator');
      expect(getRoleTheme('CORTE Y CONFECCIÓN').key).toBe('operator');
    });

    it('resuelve correctamente temas para DISEÑADOR y variantes', () => {
      expect(getRoleTheme('DISEÑADOR').key).toBe('designer');
      expect(getRoleTheme('disenador gráfico').key).toBe('designer');
      expect(getRoleTheme('ARTE TEXTIL').key).toBe('designer');
    });

    it('resuelve correctamente temas para AUDITOR y variantes', () => {
      expect(getRoleTheme('AUDITOR').key).toBe('auditor');
      expect(getRoleTheme('SUPERVISOR').key).toBe('auditor');
      expect(getRoleTheme('Control de Calidad').key).toBe('auditor');
    });

    it('ofrece fallback elegante para roles nulos, vacíos o no reconocidos', () => {
      expect(getRoleTheme(null).key).toBe('admin');
      expect(getRoleTheme('').key).toBe('admin');
      expect(getRoleTheme('ROL_DESCONOCIDO_XYZ').key).toBe('default');
    });

    it('retorna la lista completa de temas de rol registrados', () => {
      const all = getAllRoleThemes();
      expect(all.length).toBe(5);
      expect(all.map((t) => t.key)).toEqual(['admin', 'operator', 'designer', 'auditor', 'default']);
    });
  });

  describe('3. Integración en Header.tsx (Cero Hardcoding)', () => {
    it('utiliza roleTheme dinámico en lugar de clases hardcodeadas para rol y avatar', () => {
      expect(headerContent).toContain('roleTheme.avatarClass');
      expect(headerContent).toContain('roleTheme.textClass');
      expect(headerContent).toContain('roleTheme.badgeClass');
      // No debe contener clases fijas para el badge de rol
      expect(headerContent).not.toContain('bg-slate-100 text-slate-700 text-[9px] font-bold font-mono rounded uppercase');
    });
  });
});
