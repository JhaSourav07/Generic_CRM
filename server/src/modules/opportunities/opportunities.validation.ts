import { z } from 'zod';

export const getOpportunitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
  ownerId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'name', 'value', 'expectedCloseDate', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const createOpportunitySchema = z.object({
  name: z.string().trim().min(1, 'Opportunity name is required').max(200, 'Name cannot exceed 200 characters'),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  accountId: z.string().uuid('Account ID must be a valid UUID').optional().nullable(),
  contactId: z.string().uuid('Contact ID must be a valid UUID').optional().nullable(),
  leadId: z.string().uuid('Lead ID must be a valid UUID').optional().nullable(),
  pipelineId: z.string().uuid('Pipeline ID must be a valid UUID'),
  stageId: z.string().uuid('Stage ID must be a valid UUID'),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional().nullable(),
  value: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && isFinite(val) && val >= 0, 'Value must be a valid non-negative number')
    .refine((val) => val <= 999999999.99, 'Value cannot exceed 999,999,999.99')
    .optional()
    .default(0),
  probability: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && isFinite(val) && val >= 0, 'Probability must be non-negative')
    .transform((val) => (val > 1 ? val / 100 : val)) // Normalize 0-100 to 0.0-1.0
    .refine((val) => val >= 0 && val <= 1, 'Probability must be between 0 and 1 (or 0% and 100%)')
    .optional()
    .default(0),
  expectedCloseDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Expected close date must be a valid ISO date')
    .optional()
    .nullable()
});

export const updateOpportunitySchema = z.object({
  name: z.string().trim().min(1, 'Opportunity name is required').max(200, 'Name cannot exceed 200 characters').optional(),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  accountId: z.string().uuid('Account ID must be a valid UUID').optional().nullable(),
  contactId: z.string().uuid('Contact ID must be a valid UUID').optional().nullable(),
  leadId: z.string().uuid('Lead ID must be a valid UUID').optional().nullable(),
  pipelineId: z.string().uuid('Pipeline ID must be a valid UUID').optional(),
  stageId: z.string().uuid('Stage ID must be a valid UUID').optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional().nullable(),
  value: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && isFinite(val) && val >= 0, 'Value must be a valid non-negative number')
    .refine((val) => val <= 999999999.99, 'Value cannot exceed 999,999,999.99')
    .optional(),
  probability: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && isFinite(val) && val >= 0, 'Probability must be non-negative')
    .transform((val) => (val > 1 ? val / 100 : val))
    .refine((val) => val >= 0 && val <= 1, 'Probability must be between 0 and 1 (or 0% and 100%)')
    .optional(),
  expectedCloseDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Expected close date must be a valid ISO date')
    .optional()
    .nullable()
});

export const changeStageSchema = z.object({
  stageId: z.string().uuid('Stage ID must be a valid UUID')
});

export const changeStatusSchema = z.object({
  status: z.enum(['OPEN', 'WON', 'LOST']),
  lostReason: z.string().trim().max(500).optional().nullable()
});

export const assignOpportunitySchema = z.object({
  ownerId: z.string().uuid('Owner ID must be a valid UUID')
});

export const loseOpportunitySchema = z.object({
  reason: z.string().trim().max(500).optional(),
  lostReason: z.string().trim().max(500).optional()
});

export type GetOpportunitiesQuery = z.infer<typeof getOpportunitiesQuerySchema>;
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type ChangeStageInput = z.infer<typeof changeStageSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type AssignOpportunityInput = z.infer<typeof assignOpportunitySchema>;
export type LoseOpportunityInput = z.infer<typeof loseOpportunitySchema>;
