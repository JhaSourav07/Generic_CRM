import { z } from 'zod';

export const getContactsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  accountId: z.string().optional(),
  jobTitle: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'jobTitle']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  department: z.string().trim().optional(),
  isPrimary: z.boolean().optional().default(false),
  accountId: z.string().uuid('Invalid account ID').optional().or(z.literal('')),
  notes: z.string().optional()
});

export const updateContactSchema = createContactSchema.partial();

export type GetContactsQuery = z.infer<typeof getContactsQuerySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
