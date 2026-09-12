import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').optional(),
  slug: z.string().trim().min(2).toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  logo: z.string().trim().optional().nullable(),
  timezone: z.string().trim().optional(),
  currency: z.string().trim().min(3).max(3).toUpperCase().optional()
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
