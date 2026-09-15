import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);

notificationsRoutes.get('/', (req, res, next) =>
  notificationsController.list(req, res, next)
);

notificationsRoutes.get('/unread-count', (req, res, next) =>
  notificationsController.getUnreadCount(req, res, next)
);

notificationsRoutes.patch('/read-all', (req, res, next) =>
  notificationsController.markAllAsRead(req, res, next)
);

notificationsRoutes.get('/:id', (req, res, next) =>
  notificationsController.getById(req, res, next)
);

notificationsRoutes.patch('/:id/read', (req, res, next) =>
  notificationsController.markAsRead(req, res, next)
);

notificationsRoutes.delete('/:id', (req, res, next) =>
  notificationsController.delete(req, res, next)
);
