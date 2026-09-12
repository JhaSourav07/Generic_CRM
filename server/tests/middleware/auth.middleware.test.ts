import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireRole, requirePermission } from '../../src/middleware/auth.middleware.js';
import * as rbacUtils from '../../src/utils/rbac.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { Request, Response, NextFunction } from 'express';

describe('auth.middleware (unit & integration)', () => {
  describe('requireAuth middleware', () => {
    it('should extract valid token from HttpOnly cookies and attach user context to req', () => {
      const token = authService.generateToken({
        userId: 'u-123',
        organizationId: 'org-123',
        roleId: 'role-123',
        roleName: 'SALES_MANAGER',
        email: 'manager@vynexa.com'
      });

      const req = {
        cookies: { vynexa_token: token },
        headers: {}
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn();

      requireAuth(req, res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('u-123');
      expect(req.user?.organizationId).toBe('org-123');
      expect(req.user?.roleName).toBe('SALES_MANAGER');
    });

    it('should extract valid token from Authorization Bearer header if cookie is missing', () => {
      const token = authService.generateToken({
        userId: 'u-456',
        organizationId: 'org-456',
        roleId: 'role-456',
        roleName: 'SUPPORT_AGENT',
        email: 'agent@vynexa.com'
      });

      const req = {
        cookies: {},
        headers: { authorization: `Bearer ${token}` }
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn();

      requireAuth(req, res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.userId).toBe('u-456');
    });

    it('should pass 401 UNAUTHORIZED error to next() if no token is provided', () => {
      const req = {
        cookies: {},
        headers: {}
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn();

      requireAuth(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('should pass 401 error to next() if token is invalid or corrupted', () => {
      const req = {
        cookies: { vynexa_token: 'invalid-jwt-token' },
        headers: {}
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn();

      requireAuth(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
    });
  });

  describe('requireRole middleware', () => {
    it('should pass 401 error to next() if req.user is undefined', () => {
      const middleware = requireRole('SALES_MANAGER');
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn();

      middleware(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
    });

    it('should allow access (call next()) when user role matches allowed roles', () => {
      const middleware = requireRole('SALES_MANAGER', 'SALES_REPRESENTATIVE');
      const req = {
        user: {
          userId: 'u-1',
          organizationId: 'o-1',
          roleId: 'r-1',
          roleName: 'SALES_MANAGER',
          email: 'user@test.com'
        }
      } as Request;
      const res = {} as Response;
      const next = vi.fn();

      middleware(req, res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access (call next()) when user role is SUPER_ADMIN even if not explicitly listed', () => {
      const middleware = requireRole('SUPPORT_AGENT');
      const req = {
        user: {
          userId: 'u-admin',
          organizationId: 'o-1',
          roleId: 'r-admin',
          roleName: 'SUPER_ADMIN',
          email: 'admin@vynexa.com'
        }
      } as Request;
      const res = {} as Response;
      const next = vi.fn();

      middleware(req, res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });

    it('should pass 403 FORBIDDEN error to next() if user role is not allowed', () => {
      const middleware = requireRole('SUPER_ADMIN');
      const req = {
        user: {
          userId: 'u-rep',
          organizationId: 'o-1',
          roleId: 'r-rep',
          roleName: 'SALES_REPRESENTATIVE',
          email: 'rep@test.com'
        }
      } as Request;
      const res = {} as Response;
      const next = vi.fn();

      middleware(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });
  });

  describe('requirePermission middleware', () => {
    it('should pass 401 UNAUTHORIZED error to next() if req.user is undefined', async () => {
      const middleware = requirePermission('users', 'VIEW');
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn();

      await middleware(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('should call next(err) if hasPermission throws an error', async () => {
      const spy = vi.spyOn(rbacUtils, 'hasPermission').mockRejectedValueOnce(new Error('DB failure'));
      const middleware = requirePermission('users', 'VIEW');
      const req = {
        user: {
          userId: 'u-1',
          organizationId: 'o-1',
          roleId: 'r-1',
          roleName: 'SALES_MANAGER',
          email: 'user@test.com'
        }
      } as Request;
      const res = {} as Response;
      const next = vi.fn();

      await middleware(req, res, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      spy.mockRestore();
    });
  });
});
