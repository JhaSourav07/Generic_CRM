import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const dashboardRoutes = Router();

/**
 * @route GET /api/dashboard/overview
 * @desc Get aggregated CRM dashboard metrics, pipeline distribution, activities, and tasks for active tenant
 * @access Protected (RequireAuth)
 */
dashboardRoutes.get('/overview', requireAuth, (req, res, next) => {
  dashboardController.getOverview(req, res, next);
});
