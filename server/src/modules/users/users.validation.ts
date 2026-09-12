import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.string().optional().transform((val) => (val === undefined ? undefined : val === 'true')),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().uuid('Invalid role ID'),
  isActive: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  roleId: z.string().uuid('Invalid role ID').optional()
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean()
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
