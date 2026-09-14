import { describe, it, expect, vi } from 'vitest';
import { dashboardController } from '../../src/modules/dashboard/dashboard.controller.js';
import { dashboardService } from '../../src/modules/dashboard/dashboard.service.js';
import { Request, Response, NextFunction } from 'express';

describe('DashboardController (unit)', () => {
  it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    await dashboardController.getOverview(req, res, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should pass error to next(err) when dashboardService throws', async () => {
    const spy = vi.spyOn(dashboardService, 'getDashboardOverview').mockRejectedValueOnce(new Error('Service failure'));
    const req = {
      user: {
        userId: 'u-1',
        organizationId: 'org-1',
        roleId: 'r-1',
        roleName: 'SALES_MANAGER',
        email: 'user@acme.com'
      }
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await dashboardController.getOverview(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });

  it('should return fallback organization payload when organization is not found in database', async () => {
    const res = await dashboardService.getDashboardOverview('3c8e4202-6b94-4d87-8fb2-e3e7f415ef99', 'u-1');
    expect(res.organization.id).toBe('3c8e4202-6b94-4d87-8fb2-e3e7f415ef99');
    expect(res.organization.name).toBe('Organization');
    expect(res.organization.currency).toBe('USD');
    expect(res.organization.timezone).toBe('UTC');
  });
});
