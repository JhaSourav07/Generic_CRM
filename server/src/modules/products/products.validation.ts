import { z } from 'zod';

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  type: z.enum(['PRODUCT', 'SERVICE']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      return val === 'true';
    }),
  sortBy: z.enum(['name', 'price', 'createdAt', 'sku']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['PRODUCT', 'SERVICE']).default('PRODUCT'),
  price: z.coerce
    .number()
    .min(0, 'Price cannot be negative'),
  currency: z.string().min(1).max(10).default('USD'),
  isActive: z.boolean().default(true)
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty').max(255).optional(),
  sku: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['PRODUCT', 'SERVICE']).optional(),
  price: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .optional(),
  currency: z.string().min(1).max(10).optional(),
  isActive: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
