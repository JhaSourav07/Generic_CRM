import { prisma } from '../../config/prisma.js';
import { AuthContext } from '../../utils/rbac.js';
import { ListNotificationsQuery, CreateNotificationInput } from './notifications.validation.js';


interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export class NotificationsService {
  /**
   * Internal / Cross-Module helper to dispatch an in-app notification.
   */
  async createNotification(params: {
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
  }) {
    // Verify recipient belongs to the same organization and is active
    const recipient = await prisma.user.findFirst({
      where: {
        id: params.userId,
        organizationId: params.organizationId,
        isActive: true
      }
    });

    if (!recipient) {
      // Avoid throwing unhandled exceptions if recipient was removed or from another tenant
      return null;
    }

    return prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        type: params.type,
        title: params.title.trim(),
        message: params.message.trim(),
        isRead: false
      }
    });
  }

  /**
   * List paginated notifications for the authenticated user only.
   */
  async listNotifications(context: AuthContext, query: ListNotificationsQuery) {
    const { page = 1, limit = 20, isRead } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: context.organizationId,
      userId: context.userId
    };

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const [total, notifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({
        where: {
          organizationId: context.organizationId,
          userId: context.userId,
          isRead: false
        }
      })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Real-time unread count from PostgreSQL.
   */
  async getUnreadCount(context: AuthContext) {
    const count = await prisma.notification.count({
      where: {
        organizationId: context.organizationId,
        userId: context.userId,
        isRead: false
      }
    });
    return { unreadCount: count };
  }

  /**
   * Get single notification with user isolation check.
   */
  async getNotificationById(context: AuthContext, id: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        organizationId: context.organizationId,
        userId: context.userId
      }
    });

    if (!notification) {
      const err: AppError = new Error('Notification not found or access denied.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return notification;
  }

  /**
   * Mark single notification as read.
   */
  async markAsRead(context: AuthContext, id: string) {
    await this.getNotificationById(context, id);

    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Mark all notifications for the current user as read.
   */
  async markAllAsRead(context: AuthContext) {
    const result = await prisma.notification.updateMany({
      where: {
        organizationId: context.organizationId,
        userId: context.userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return { success: true, updatedCount: result.count };
  }

  /**
   * Delete a notification belonging to the current user.
   */
  async deleteNotification(context: AuthContext, id: string) {
    await this.getNotificationById(context, id);

    await prisma.notification.delete({
      where: { id }
    });

    return { success: true, message: 'Notification removed successfully.' };
  }
}

export const notificationsService = new NotificationsService();
