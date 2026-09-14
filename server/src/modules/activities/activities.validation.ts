import { z } from 'zod';
import { ActivityType } from '@prisma/client';

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType).default(ActivityType.NOTE),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject cannot exceed 200 characters'),
  description: z.string().max(4000, 'Description cannot exceed 4000 characters').optional().nullable(),
  activityDate: z.coerce.date().optional(),
  duration: z.number().int().min(0, 'Duration cannot be negative').max(10080, 'Duration cannot exceed 7 days').optional().nullable(),
  leadId: z.string().uuid('Invalid lead ID format').optional().nullable(),
  accountId: z.string().uuid('Invalid account ID format').optional().nullable(),
  contactId: z.string().uuid('Invalid contact ID format').optional().nullable(),
  opportunityId: z.string().uuid('Invalid opportunity ID format').optional().nullable()
});

export const updateActivitySchema = z.object({
  type: z.nativeEnum(ActivityType).optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject cannot exceed 200 characters').optional(),
  description: z.string().max(4000, 'Description cannot exceed 4000 characters').optional().nullable(),
  activityDate: z.coerce.date().optional(),
  duration: z.number().int().min(0, 'Duration cannot be negative').max(10080, 'Duration cannot exceed 7 days').optional().nullable(),
  leadId: z.string().uuid('Invalid lead ID format').optional().nullable(),
  accountId: z.string().uuid('Invalid account ID format').optional().nullable(),
  contactId: z.string().uuid('Invalid contact ID format').optional().nullable(),
  opportunityId: z.string().uuid('Invalid opportunity ID format').optional().nullable()
});

export const getActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z.nativeEnum(ActivityType).optional(),
  createdById: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['activityDate', 'createdAt', 'subject', 'type']).default('activityDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const getTimelineQuerySchema = z.object({
  leadId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50)
}).refine(
  (data) => data.leadId || data.accountId || data.contactId || data.opportunityId,
  {
    message: 'At least one target entity identifier (leadId, accountId, contactId, or opportunityId) is required for timeline query'
  }
);

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type GetActivitiesQuery = z.infer<typeof getActivitiesQuerySchema>;
export type GetTimelineQuery = z.infer<typeof getTimelineQuerySchema>;
