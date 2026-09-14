import { Router } from 'express';
import { accountsController } from './accounts.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const accountsRoutes = Router();

accountsRoutes.use(requireAuth);

accountsRoutes.get('/', requirePermission('accounts', 'VIEW'), (req, res, next) => accountsController.getAccounts(req, res, next));
accountsRoutes.get('/:id', requirePermission('accounts', 'VIEW'), (req, res, next) => accountsController.getAccountById(req, res, next));
accountsRoutes.post('/', requirePermission('accounts', 'CREATE'), (req, res, next) => accountsController.createAccount(req, res, next));
accountsRoutes.patch('/:id', requirePermission('accounts', 'UPDATE'), (req, res, next) => accountsController.updateAccount(req, res, next));
accountsRoutes.delete('/:id', requirePermission('accounts', 'DELETE'), (req, res, next) => accountsController.deleteAccount(req, res, next));
accountsRoutes.patch('/:id/assign', requirePermission('accounts', 'ASSIGN'), (req, res, next) => accountsController.assignAccount(req, res, next));
