import { z } from 'zod';
import { SupportCasePriority, SupportCaseStatus } from '@prisma/client';

export const listSupportCasesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(SupportCaseStatus).optional(),
  priority: z.nativeEnum(SupportCasePriority).optional(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'subject']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const createSupportCaseSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  priority: z.nativeEnum(SupportCasePriority).default(SupportCasePriority.MEDIUM),
  accountId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable()
});

export const updateSupportCaseSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.nativeEnum(SupportCasePriority).optional(),
  accountId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable()
});

export const assignSupportCaseSchema = z.object({
  assignedToId: z.string().uuid().nullable()
});

export const changeSupportCaseStatusSchema = z.object({
  status: z.nativeEnum(SupportCaseStatus)
});

export const resolveSupportCaseSchema = z.object({
  resolution: z.string().min(1, 'Resolution details are required to resolve a case').max(5000)
});

export const closeSupportCaseSchema = z.object({
  notes: z.string().max(2000).optional()
});

export type ListSupportCasesQuery = z.infer<typeof listSupportCasesSchema>;
export type CreateSupportCaseInput = z.infer<typeof createSupportCaseSchema>;
export type UpdateSupportCaseInput = z.infer<typeof updateSupportCaseSchema>;
export type AssignSupportCaseInput = z.infer<typeof assignSupportCaseSchema>;
export type ChangeSupportCaseStatusInput = z.infer<typeof changeSupportCaseStatusSchema>;
export type ResolveSupportCaseInput = z.infer<typeof resolveSupportCaseSchema>;
export type CloseSupportCaseInput = z.infer<typeof closeSupportCaseSchema>;
