import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const tasksRoutes = Router();

tasksRoutes.use(requireAuth);

tasksRoutes.get('/', requirePermission('tasks', 'VIEW'), (req, res, next) =>
  tasksController.getTasks(req, res, next)
);

tasksRoutes.get('/:id', requirePermission('tasks', 'VIEW'), (req, res, next) =>
  tasksController.getTaskById(req, res, next)
);

tasksRoutes.post('/', requirePermission('tasks', 'CREATE'), (req, res, next) =>
  tasksController.createTask(req, res, next)
);

tasksRoutes.patch('/:id', requirePermission('tasks', 'UPDATE'), (req, res, next) =>
  tasksController.updateTask(req, res, next)
);

tasksRoutes.delete('/:id', requirePermission('tasks', 'DELETE'), (req, res, next) =>
  tasksController.deleteTask(req, res, next)
);

tasksRoutes.patch('/:id/status', requirePermission('tasks', 'UPDATE'), (req, res, next) =>
  tasksController.changeStatus(req, res, next)
);

tasksRoutes.patch('/:id/assign', requirePermission('tasks', 'ASSIGN'), (req, res, next) =>
  tasksController.assignTask(req, res, next)
);

tasksRoutes.patch('/:id/complete', requirePermission('tasks', 'UPDATE'), (req, res, next) =>
  tasksController.completeTask(req, res, next)
);
