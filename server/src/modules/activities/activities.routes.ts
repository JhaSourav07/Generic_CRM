import { Router } from 'express';
import { activitiesController } from './activities.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const activitiesRoutes = Router();

activitiesRoutes.use(requireAuth);

activitiesRoutes.get('/timeline', requirePermission('activities', 'VIEW'), (req, res, next) =>
  activitiesController.getTimeline(req, res, next)
);

activitiesRoutes.get('/', requirePermission('activities', 'VIEW'), (req, res, next) =>
  activitiesController.getActivities(req, res, next)
);

activitiesRoutes.get('/:id', requirePermission('activities', 'VIEW'), (req, res, next) =>
  activitiesController.getActivityById(req, res, next)
);

activitiesRoutes.post('/', requirePermission('activities', 'CREATE'), (req, res, next) =>
  activitiesController.createActivity(req, res, next)
);

activitiesRoutes.patch('/:id', requirePermission('activities', 'UPDATE'), (req, res, next) =>
  activitiesController.updateActivity(req, res, next)
);

activitiesRoutes.delete('/:id', requirePermission('activities', 'DELETE'), (req, res, next) =>
  activitiesController.deleteActivity(req, res, next)
);
