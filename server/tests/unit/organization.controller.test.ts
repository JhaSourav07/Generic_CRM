import { describe, it, expect, vi } from 'vitest';
import { OrganizationController } from '../../src/modules/organization/organization.controller.js';
import { organizationService } from '../../src/modules/organization/organization.service.js';
import { Request, Response, NextFunction } from 'express';

describe('OrganizationController (unit)', () => {
  const controller = new OrganizationController();

  describe('getOrganization', () => {
    it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined', async () => {
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn();

      await controller.getOrganization(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
    });

    it('should pass error to next(err) when service throws', async () => {
      const spy = vi.spyOn(organizationService, 'getOrganization').mockRejectedValueOnce(new Error('DB failure'));
      const req = {
        user: { userId: 'u-1', organizationId: 'non-existent-org' }
      } as Request;
      const res = {} as Response;
      const next = vi.fn();

      await controller.getOrganization(req, res, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      spy.mockRestore();
    });
  });

  describe('updateOrganization', () => {
    it('should pass 401 UNAUTHORIZED error to next() when req.user is undefined', async () => {
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn();

      await controller.updateOrganization(req, res, next as NextFunction);

      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
    });
  });
});
