import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class DashboardController {
  /**
   * Controller handler for GET /api/dashboard/overview
   * Strictly enforces organization context from authenticated req.user session
   */
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { organizationId, userId } = req.user;

      const data = await dashboardService.getDashboardOverview(organizationId, userId);

      res.status(200).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString()
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
