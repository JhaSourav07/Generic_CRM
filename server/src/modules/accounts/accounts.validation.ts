import { z } from 'zod';

export const getAccountsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  industry: z.string().optional(),
  status: z.string().optional(),
  ownerId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'industry', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Account / Customer name is required'),
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  status: z.string().optional().default('ACTIVE'),
  notes: z.string().optional(),
  ownerId: z.string().uuid('Invalid owner ID').optional()
});

export const updateAccountSchema = createAccountSchema.partial();

export const assignAccountSchema = z.object({
  ownerId: z.string().uuid('Invalid owner ID')
});

export type GetAccountsQuery = z.infer<typeof getAccountsQuerySchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AssignAccountInput = z.infer<typeof assignAccountSchema>;
