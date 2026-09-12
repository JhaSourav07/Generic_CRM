import { Router } from 'express';
import { usersController } from './users.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const usersRoutes = Router();

// Apply requireAuth to all user routes
usersRoutes.use(requireAuth);

usersRoutes.get('/', requirePermission('users', 'VIEW'), (req, res, next) => usersController.getUsers(req, res, next));
usersRoutes.get('/:id', requirePermission('users', 'VIEW'), (req, res, next) => usersController.getUserById(req, res, next));
usersRoutes.post('/', requirePermission('users', 'CREATE'), (req, res, next) => usersController.createUser(req, res, next));
usersRoutes.patch('/:id', requirePermission('users', 'UPDATE'), (req, res, next) => usersController.updateUser(req, res, next));
usersRoutes.put('/:id', requirePermission('users', 'UPDATE'), (req, res, next) => usersController.updateUser(req, res, next));
usersRoutes.patch('/:id/status', requirePermission('users', 'UPDATE'), (req, res, next) => usersController.toggleUserStatus(req, res, next));

