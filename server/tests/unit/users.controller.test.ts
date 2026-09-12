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
});
