import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query parameter "q" is required' })
    .trim()
    .min(1, 'Search query must contain at least 1 character')
    .max(100, 'Search query cannot exceed 100 characters'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'Limit must be a number between 1 and 50'
    })
});

export type SearchQueryParams = z.infer<typeof searchQuerySchema>;
