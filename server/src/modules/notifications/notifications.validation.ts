import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isRead: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000)
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
