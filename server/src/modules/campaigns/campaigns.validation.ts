import { z } from 'zod';

export const CampaignStatusEnum = z.enum([
  'PLANNING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED'
]);

export const listCampaignsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: CampaignStatusEnum.optional(),
  type: z.string().optional(),
  createdById: z.string().uuid().optional(),
  startDateFrom: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  startDateTo: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDateFrom: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDateTo: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'status', 'type', 'budget', 'startDate', 'endDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  status: CampaignStatusEnum.default('PLANNING'),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  budget: z.coerce.number().nonnegative('Budget must be a non-negative number').optional().nullable()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  status: CampaignStatusEnum.optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  budget: z.coerce.number().nonnegative().optional().nullable()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

export const changeCampaignStatusSchema = z.object({
  status: CampaignStatusEnum
});

export const addCampaignLeadSchema = z.object({
  leadId: z.string().uuid('Valid Lead ID is required')
});

export const bulkAddCampaignLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, 'At least one lead ID is required').max(500, 'Maximum 500 leads per bulk request')
});

export const listCampaignLeadsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional()
});

export type ListCampaignsQuery = z.infer<typeof listCampaignsSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ChangeCampaignStatusInput = z.infer<typeof changeCampaignStatusSchema>;
export type AddCampaignLeadInput = z.infer<typeof addCampaignLeadSchema>;
export type BulkAddCampaignLeadsInput = z.infer<typeof bulkAddCampaignLeadsSchema>;
export type ListCampaignLeadsQuery = z.infer<typeof listCampaignLeadsSchema>;
