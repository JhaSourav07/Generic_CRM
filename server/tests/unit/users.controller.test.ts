import { describe, it, expect, vi } from 'vitest';
import { usersController } from '../../src/modules/users/users.controller.js';
import { usersService } from '../../src/modules/users/users.service.js';
import { Request, Response, NextFunction } from 'express';

describe('UsersController (unit)', () => {
  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in getUsers', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.getUsers(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass error to next(err) when usersService.getUsers throws', async () => {
    const spy = vi.spyOn(usersService, 'getUsers').mockRejectedValueOnce(new Error('Users error'));
    const req = { user: { organizationId: 'org-1' }, query: {} } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.getUsers(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in getUserById', async () => {
    const req = { params: { id: 'u1' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.getUserById(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in createUser', async () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.createUser(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in updateUser', async () => {
    const req = { params: { id: 'u1' }, body: {} } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.updateUser(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in toggleUserStatus', async () => {
    const req = { params: { id: 'u1' }, body: {} } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.toggleUserStatus(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass error to next(err) when usersService throws', async () => {
    const spy = vi.spyOn(usersService, 'getUserById').mockRejectedValueOnce(new Error('User service error'));
    const req = {
      user: { userId: 'u-admin', organizationId: 'org-1' },
      params: { id: 'u-1' }
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await usersController.getUserById(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });

  it('should list users with default query fallbacks and create active user', async () => {
    const { createTestOrg } = await import('../factories/org.factory.js');
    const { createTestRole } = await import('../factories/role.factory.js');
    const { createTestUser } = await import('../factories/user.factory.js');

    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });

    const res = await usersService.getUsers(org.id, {});
    expect(res.meta.page).toBe(1);
    expect(res.meta.limit).toBe(10);

    const created = await usersService.createUser(org.id, user.id, {
      name: 'Explicit Active User',
      email: 'explicit.active@acme.com',
      password: 'Password123!',
      roleId: role.id,
      isActive: true
    });
    expect(created.isActive).toBe(true);

    const { prismaTest } = await import('../helpers/testDb.js');
    const loggedInUser = await prismaTest.user.create({
      data: {
        organizationId: org.id,
        roleId: role.id,
        name: 'Logged In User',
        email: 'login@acme.com',
        passwordHash: 'hash',
        lastLoginAt: new Date()
      },
      include: { organization: true, role: true }
    });

    const sanitized = usersService.sanitizeUser(loggedInUser);
    expect(sanitized.lastLoginAt).toBeDefined();
  });
});
