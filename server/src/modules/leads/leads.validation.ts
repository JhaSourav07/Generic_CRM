import { z } from 'zod';
import { LeadStatus } from '@prisma/client';

export const leadStatusEnum = z.nativeEnum(LeadStatus);

export const getLeadsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  status: leadStatusEnum.optional(),
  source: z.string().optional(),
  ownerId: z.string().optional(),
  minScore: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  maxScore: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'company', 'score', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const createLeadSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: leadStatusEnum.optional().default(LeadStatus.NEW),
  score: z.number().int().min(0).max(100).optional().default(0),
  notes: z.string().optional(),
  ownerId: z.string().uuid('Invalid owner ID').optional()
});

export const updateLeadSchema = createLeadSchema.partial();

export const assignLeadSchema = z.object({
  ownerId: z.string().uuid('Invalid owner ID')
});

export const changeLeadStatusSchema = z.object({
  status: leadStatusEnum
});

export const convertLeadSchema = z.object({
  account: z.object({
    name: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    website: z.string().trim().optional(),
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    postalCode: z.string().trim().optional()
  }).optional(),
  contact: z.object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().trim().optional(),
    jobTitle: z.string().trim().optional()
  }).optional(),
  createOpportunity: z.boolean().optional().default(false),
  opportunity: z.object({
    name: z.string().trim().min(1, 'Opportunity name is required').optional(),
    value: z.number().min(0, 'Opportunity value must be positive').optional().default(0),
    pipelineId: z.string().uuid('Invalid pipeline ID').optional(),
    stageId: z.string().uuid('Invalid stage ID').optional(),
    expectedCloseDate: z.string().optional()
  }).optional()
});

export type GetLeadsQuery = z.infer<typeof getLeadsQuerySchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type ChangeLeadStatusInput = z.infer<typeof changeLeadStatusSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
