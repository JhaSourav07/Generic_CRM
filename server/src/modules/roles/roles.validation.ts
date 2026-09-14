import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters'),
  description: z.string().trim().nullable().optional(),
  permissionIds: z.array(z.string().uuid('Invalid permission ID')).optional().default([])
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().trim().nullable().optional(),
  permissionIds: z.array(z.string().uuid('Invalid permission ID')).optional()
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
