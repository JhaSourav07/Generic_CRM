import { Router } from 'express';
import { rolesController } from './roles.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const rolesRoutes = Router();
export const permissionsRoutes = Router();

// Roles routes protected by requireAuth
rolesRoutes.use(requireAuth);

rolesRoutes.get('/', requirePermission('roles', 'VIEW'), (req, res, next) => {
  rolesController.getRoles(req, res, next);
});

rolesRoutes.get('/:id', requirePermission('roles', 'VIEW'), (req, res, next) => {
  rolesController.getRoleById(req, res, next);
});

rolesRoutes.post('/', requirePermission('roles', 'CREATE'), (req, res, next) => {
  rolesController.createRole(req, res, next);
});

rolesRoutes.patch('/:id', requirePermission('roles', 'UPDATE'), (req, res, next) => {
  rolesController.updateRole(req, res, next);
});

rolesRoutes.put('/:id', requirePermission('roles', 'UPDATE'), (req, res, next) => {
  rolesController.updateRole(req, res, next);
});

rolesRoutes.delete('/:id', requirePermission('roles', 'DELETE'), (req, res, next) => {
  rolesController.deleteRole(req, res, next);
});

// Permissions route
permissionsRoutes.use(requireAuth);
permissionsRoutes.get('/', requirePermission('roles', 'VIEW'), (req, res, next) => {
  rolesController.getPermissions(req, res, next);
});
