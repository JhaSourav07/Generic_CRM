import { describe, it, expect, vi } from 'vitest';
import { authController } from '../../src/modules/auth/auth.controller.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { Request, Response, NextFunction } from 'express';

describe('AuthController (unit)', () => {
  it('should pass validation error to next() when signup body is invalid', async () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await authController.signup(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should pass service error to next() when authService.signup throws in signup', async () => {
    const spy = vi.spyOn(authService, 'signup').mockRejectedValue(new Error('Signup DB Error'));
    const req = {
      body: {
        organizationName: 'Acme',
        name: 'Alex Vance',
        email: 'alex@acme.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      }
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await authController.signup(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Signup DB Error');

    spy.mockRestore();
  });

  it('should pass validation error to next() when login body is invalid', async () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await authController.login(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should pass service error to next() when authService.login throws in login', async () => {
    const spy = vi.spyOn(authService, 'login').mockRejectedValue(new Error('Login DB Error'));
    const req = {
      body: {
        email: 'alex@acme.com',
        password: 'Password123!'
      }
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await authController.login(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Login DB Error');

    spy.mockRestore();
  });

  it('should pass error to next() when res.clearCookie throws in logout', async () => {
    const req = {} as Request;
    const res = {
      clearCookie: vi.fn().mockImplementation(() => {
        throw new Error('Cookie clearance error');
      })
    } as unknown as Response;
    const next = vi.fn();

    await authController.logout(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Cookie clearance error');
  });

  it('should pass 401 error to next() when req.user is undefined in getMe', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    await authController.getMe(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should pass service error to next() when authService.getMe throws in getMe', async () => {
    const spy = vi.spyOn(authService, 'getMe').mockRejectedValue(new Error('Service DB Error'));

    const req = {
      user: {
        userId: 'u-123',
        organizationId: 'o-123',
        roleId: 'r-123',
        roleName: 'ADMIN',
        email: 'admin@test.com'
      }
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await authController.getMe(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Service DB Error');

    spy.mockRestore();
  });
});
