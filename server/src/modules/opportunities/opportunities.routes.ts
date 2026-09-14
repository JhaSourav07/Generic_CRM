import { Router } from 'express';
import { opportunitiesController } from './opportunities.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const opportunitiesRoutes = Router();

opportunitiesRoutes.use(requireAuth);

opportunitiesRoutes.get('/', requirePermission('opportunities', 'VIEW'), (req, res, next) =>
  opportunitiesController.getOpportunities(req, res, next)
);

opportunitiesRoutes.get('/:id', requirePermission('opportunities', 'VIEW'), (req, res, next) =>
  opportunitiesController.getOpportunityById(req, res, next)
);

opportunitiesRoutes.post('/', requirePermission('opportunities', 'CREATE'), (req, res, next) =>
  opportunitiesController.createOpportunity(req, res, next)
);

opportunitiesRoutes.patch('/:id', requirePermission('opportunities', 'UPDATE'), (req, res, next) =>
  opportunitiesController.updateOpportunity(req, res, next)
);

opportunitiesRoutes.delete('/:id', requirePermission('opportunities', 'DELETE'), (req, res, next) =>
  opportunitiesController.deleteOpportunity(req, res, next)
);

opportunitiesRoutes.patch('/:id/stage', requirePermission('opportunities', 'UPDATE'), (req, res, next) =>
  opportunitiesController.changeStage(req, res, next)
);

opportunitiesRoutes.patch('/:id/assign', requirePermission('opportunities', 'ASSIGN'), (req, res, next) =>
  opportunitiesController.assignOpportunity(req, res, next)
);

opportunitiesRoutes.post('/:id/win', requirePermission('opportunities', 'UPDATE'), (req, res, next) =>
  opportunitiesController.winOpportunity(req, res, next)
);

opportunitiesRoutes.post('/:id/lose', requirePermission('opportunities', 'UPDATE'), (req, res, next) =>
  opportunitiesController.loseOpportunity(req, res, next)
);
