import { z } from 'zod';

export const createStageInputSchema = z.object({
  name: z.string().trim().min(1, 'Stage name is required').max(100, 'Stage name cannot exceed 100 characters'),
  order: z.number().int().min(1).optional(),
  probability: z.number().min(0).max(1).optional().default(0)
});

export const createPipelineSchema = z.object({
  name: z.string().trim().min(1, 'Pipeline name is required').max(100, 'Pipeline name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  stages: z.array(createStageInputSchema).optional()
});

export const updatePipelineSchema = z.object({
  name: z.string().trim().min(1, 'Pipeline name is required').max(100, 'Pipeline name cannot exceed 100 characters').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  isDefault: z.boolean().optional()
});

export const createStageSchema = z.object({
  name: z.string().trim().min(1, 'Stage name is required').max(100, 'Stage name cannot exceed 100 characters'),
  order: z.number().int().min(1).optional(),
  probability: z.number().min(0).max(1).optional().default(0)
});

export const updateStageSchema = z.object({
  name: z.string().trim().min(1, 'Stage name is required').max(100, 'Stage name cannot exceed 100 characters').optional(),
  order: z.number().int().min(1).optional(),
  probability: z.number().min(0).max(1).optional()
});

export const reorderStagesSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().uuid('Stage ID must be a valid UUID'),
      order: z.number().int().min(1)
    })
  ).min(1, 'At least one stage must be provided')
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
