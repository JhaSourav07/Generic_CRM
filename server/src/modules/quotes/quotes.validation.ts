import { z } from 'zod';

export const quoteLineItemInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Item description is required').max(500),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative').optional(),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
  tax: z.coerce.number().min(0, 'Tax cannot be negative').default(0)
});

export const getQuotesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  accountId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['quoteNumber', 'total', 'validUntil', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type GetQuotesQuery = z.infer<typeof getQuotesQuerySchema>;

export const createQuoteSchema = z.object({
  accountId: z.string().uuid('Invalid Account ID').optional().nullable(),
  opportunityId: z.string().uuid('Invalid Opportunity ID').optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
  items: z.array(quoteLineItemInputSchema).min(1, 'Quote must have at least one line item')
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const updateQuoteSchema = z.object({
  accountId: z.string().uuid('Invalid Account ID').optional().nullable(),
  opportunityId: z.string().uuid('Invalid Opportunity ID').optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
  items: z.array(quoteLineItemInputSchema).min(1, 'Quote must have at least one line item').optional()
});

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

export const rejectQuoteSchema = z.object({
  reason: z.string().max(1000).optional()
});
