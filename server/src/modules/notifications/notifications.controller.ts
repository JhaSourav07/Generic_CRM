import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { listNotificationsSchema } from './notifications.validation.js';
import { AuthContext } from '../../utils/rbac.js';

function getAuthContext(req: Request): AuthContext {
  const user = (req as any).user;
  return {
    userId: user.userId || user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };
}

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const query = listNotificationsSchema.parse(req.query);
      const result = await notificationsService.listNotifications(context, query);
      res.json({
        success: true,
        data: result.notifications,
        meta: {
          ...result.pagination,
          unreadCount: result.unreadCount
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await notificationsService.getUnreadCount(context);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const notification = await notificationsService.getNotificationById(context, req.params.id);
      res.json({
        success: true,
        data: notification,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const updated = await notificationsService.markAsRead(context, req.params.id);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await notificationsService.markAllAsRead(context);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await notificationsService.deleteNotification(context, req.params.id);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
