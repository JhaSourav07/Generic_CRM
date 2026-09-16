import { Router } from 'express';
import { leadsController } from './leads.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const leadsRoutes = Router();

// Apply global auth to all lead endpoints
leadsRoutes.use(requireAuth);

leadsRoutes.get('/', requirePermission('leads', 'VIEW'), (req, res, next) => leadsController.getLeads(req, res, next));
leadsRoutes.get('/:id', requirePermission('leads', 'VIEW'), (req, res, next) => leadsController.getLeadById(req, res, next));
leadsRoutes.get('/:id/score', requirePermission('leads', 'VIEW'), (req, res, next) => leadsController.getLeadScore(req, res, next));
leadsRoutes.post('/', requirePermission('leads', 'CREATE'), (req, res, next) => leadsController.createLead(req, res, next));
leadsRoutes.patch('/:id', requirePermission('leads', 'UPDATE'), (req, res, next) => leadsController.updateLead(req, res, next));
leadsRoutes.delete('/:id', requirePermission('leads', 'DELETE'), (req, res, next) => leadsController.deleteLead(req, res, next));

leadsRoutes.patch('/:id/assign', requirePermission('leads', 'ASSIGN'), (req, res, next) => leadsController.assignLead(req, res, next));
leadsRoutes.patch('/:id/status', requirePermission('leads', 'UPDATE'), (req, res, next) => leadsController.changeLeadStatus(req, res, next));
leadsRoutes.post('/:id/convert', requirePermission('leads', 'UPDATE'), (req, res, next) => leadsController.convertLead(req, res, next));
