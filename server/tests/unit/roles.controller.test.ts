import { describe, it, expect, vi } from 'vitest';
import { rolesController } from '../../src/modules/roles/roles.controller.js';
import { rolesService } from '../../src/modules/roles/roles.service.js';
import { Request, Response, NextFunction } from 'express';

describe('RolesController (unit)', () => {
  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in getRoles', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.getRoles(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass error to next(err) when rolesService.getRoles throws', async () => {
    const spy = vi.spyOn(rolesService, 'getRoles').mockRejectedValueOnce(new Error('Roles error'));
    const req = { user: { organizationId: 'org-1' } } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.getRoles(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in getRoleById', async () => {
    const req = { params: { id: 'r1' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.getRoleById(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in createRole', async () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.createRole(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in updateRole', async () => {
    const req = { params: { id: 'r1' }, body: {} } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.updateRole(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined in deleteRole', async () => {
    const req = { params: { id: 'r1' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.deleteRole(req, res, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should pass error to next(err) when rolesService.getPermissions throws', async () => {
    const spy = vi.spyOn(rolesService, 'getPermissions').mockRejectedValueOnce(new Error('Permission service error'));
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    await rolesController.getPermissions(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });
});
