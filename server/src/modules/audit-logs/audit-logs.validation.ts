import { z } from 'zod';

export const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  sortBy: z.enum(['createdAt', 'action', 'entity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

export const getAuditLogParamsSchema = z.object({
  id: z.string().uuid('Valid Audit Log ID is required')
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>;
export type GetAuditLogParams = z.infer<typeof getAuditLogParamsSchema>;
