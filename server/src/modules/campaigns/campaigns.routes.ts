import { Router } from 'express';
import { campaignsController } from './campaigns.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const campaignsRoutes = Router();

campaignsRoutes.use(requireAuth);

campaignsRoutes.get('/', requirePermission('campaigns', 'VIEW'), (req, res, next) =>
  campaignsController.list(req, res, next)
);

campaignsRoutes.get('/:id', requirePermission('campaigns', 'VIEW'), (req, res, next) =>
  campaignsController.getById(req, res, next)
);

campaignsRoutes.post('/', requirePermission('campaigns', 'CREATE'), (req, res, next) =>
  campaignsController.create(req, res, next)
);

campaignsRoutes.patch('/:id', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.update(req, res, next)
);

campaignsRoutes.delete('/:id', requirePermission('campaigns', 'DELETE'), (req, res, next) =>
  campaignsController.delete(req, res, next)
);

// Lifecycle actions
campaignsRoutes.post('/:id/activate', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.activate(req, res, next)
);

campaignsRoutes.post('/:id/pause', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.pause(req, res, next)
);

campaignsRoutes.post('/:id/complete', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.complete(req, res, next)
);

// Campaign Lead Associations
campaignsRoutes.get('/:id/leads', requirePermission('campaigns', 'VIEW'), (req, res, next) =>
  campaignsController.getLeads(req, res, next)
);

campaignsRoutes.post('/:id/leads/bulk', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.bulkAddLeads(req, res, next)
);

campaignsRoutes.post('/:id/leads/:leadId', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.addLead(req, res, next)
);

campaignsRoutes.delete('/:id/leads/:leadId', requirePermission('campaigns', 'UPDATE'), (req, res, next) =>
  campaignsController.removeLead(req, res, next)
);
