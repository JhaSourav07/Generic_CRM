import { describe, it, expect } from 'vitest';
import { isSuperAdmin, hasPermission, SUPER_ADMIN_ROLE } from '../../src/utils/rbac.js';
import { env } from '../../src/config/env.js';

describe('RBAC Utility Module (unit)', () => {
  describe('isSuperAdmin()', () => {
    it('should return true if role is SUPER_ADMIN', () => {
      const context = {
        userId: 'u1',
        email: 'user@acme.com',
        role: SUPER_ADMIN_ROLE,
        organizationId: 'org1'
      };
      expect(isSuperAdmin(context)).toBe(true);
    });

    it('should return true if email matches ADMIN_EMAIL regardless of role', () => {
      const context = {
        userId: 'u2',
        email: env.ADMIN_EMAIL.toUpperCase(), // Test case insensitivity
        role: 'SALES_REPRESENTATIVE',
        organizationId: 'org1'
      };
      expect(isSuperAdmin(context)).toBe(true);
    });

    it('should return false for regular sales roles with non-admin email', () => {
      const context = {
        userId: 'u3',
        email: 'rep@acme.com',
        role: 'SALES_REPRESENTATIVE',
        organizationId: 'org1'
      };
      expect(isSuperAdmin(context)).toBe(false);
    });

    it('should return false if context.email is missing or empty', () => {
      const context = {
        userId: 'u4',
        email: '',
        role: 'MEMBER',
        organizationId: 'org1'
      };
      expect(isSuperAdmin(context)).toBe(false);
    });
  });

  describe('hasPermission()', () => {
    it('should return true for Super Admin for any required permission', () => {
      const context = {
        userId: 'u1',
        email: env.ADMIN_EMAIL,
        role: SUPER_ADMIN_ROLE,
        organizationId: 'org1'
      };
      expect(hasPermission(context, 'opportunities:delete')).toBe(true);
      expect(hasPermission(context, 'settings:update')).toBe(true);
    });

    it('should return false for non-super admin roles (fallback phase logic)', () => {
      const context = {
        userId: 'u2',
        email: 'manager@acme.com',
        role: 'SALES_MANAGER',
        organizationId: 'org1'
      };
      expect(hasPermission(context, 'opportunities:delete')).toBe(false);
    });
  });
});
