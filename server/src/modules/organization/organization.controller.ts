import { Request, Response, NextFunction } from 'express';
import { organizationService } from './organization.service.js';
import { updateOrganizationSchema } from './organization.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class OrganizationController {
  public async getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const org = await organizationService.getOrganization(req.user.organizationId);

      res.status(200).json({
        success: true,
        data: org,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = updateOrganizationSchema.parse(req.body);
      const updated = await organizationService.updateOrganization(
        req.user.organizationId,
        req.user.userId,
        input
      );

      res.status(200).json({
        success: true,
        data: updated,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const organizationController = new OrganizationController();
