import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { exportRateLimiter } from '../../middleware/rateLimiter.js';

export const reportsRoutes = Router();

reportsRoutes.use(requireAuth);

reportsRoutes.get('/overview', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.overview(req, res, next)
);

reportsRoutes.get('/leads', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.leads(req, res, next)
);

reportsRoutes.get('/sales', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.sales(req, res, next)
);

reportsRoutes.get('/pipeline', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.pipeline(req, res, next)
);

reportsRoutes.get('/activities', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.activities(req, res, next)
);

reportsRoutes.get('/tasks', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.tasks(req, res, next)
);

reportsRoutes.get('/support', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.support(req, res, next)
);

reportsRoutes.get('/campaigns', requirePermission('reports', 'VIEW'), (req, res, next) =>
  reportsController.campaigns(req, res, next)
);

reportsRoutes.get('/:reportType/export', requirePermission('reports', 'EXPORT'), exportRateLimiter, (req, res, next) =>
  reportsController.exportCsv(req, res, next)
);

