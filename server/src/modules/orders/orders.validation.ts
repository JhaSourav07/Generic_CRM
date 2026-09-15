import { z } from 'zod';

export const orderLineItemInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Item description is required').max(500),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative').optional(),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
  tax: z.coerce.number().min(0, 'Tax cannot be negative').default(0)
});

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED']).optional(),
  accountId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['orderNumber', 'total', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;

export const createOrderSchema = z.object({
  accountId: z.string().uuid('Invalid Account ID').optional().nullable(),
  opportunityId: z.string().uuid('Invalid Opportunity ID').optional().nullable(),
  quoteId: z.string().uuid('Invalid Quote ID').optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
  items: z.array(orderLineItemInputSchema).min(1, 'Order must have at least one line item')
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  notes: z.string().max(3000).optional().nullable()
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().max(1000).optional()
});
