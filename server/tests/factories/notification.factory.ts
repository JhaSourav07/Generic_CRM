import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateNotificationOptions {
  organizationId: string;
  userId: string;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
}

export async function createTestNotification(options: CreateNotificationOptions) {
  const uid = crypto.randomUUID().slice(0, 8);

  return prismaTest.notification.create({
    data: {
      organizationId: options.organizationId,
      userId: options.userId,
      type: options.type || 'SYSTEM_ALERT',
      title: options.title || `Test Alert ${uid}`,
      message: options.message || `Test notification body message ${uid}`,
      isRead: options.isRead !== undefined ? options.isRead : false
    }
  });
}
