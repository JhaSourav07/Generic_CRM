import { Router } from 'express';
import { organizationController } from './organization.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const organizationRoutes = Router();

organizationRoutes.use(requireAuth);

organizationRoutes.get(['/', '/current'], requirePermission('settings', 'VIEW'), (req, res, next) => {
  organizationController.getOrganization(req, res, next);
});

organizationRoutes.patch(['/', '/current'], requirePermission('settings', 'UPDATE'), (req, res, next) => {
  organizationController.updateOrganization(req, res, next);
});
