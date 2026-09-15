import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().max(4000, 'Description cannot exceed 4000 characters').optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional().nullable(),
  assignedToId: z.string().uuid('Invalid assigned user ID format').optional().nullable(),
  leadId: z.string().uuid('Invalid lead ID format').optional().nullable(),
  accountId: z.string().uuid('Invalid account ID format').optional().nullable(),
  contactId: z.string().uuid('Invalid contact ID format').optional().nullable(),
  opportunityId: z.string().uuid('Invalid opportunity ID format').optional().nullable()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').optional(),
  description: z.string().max(4000, 'Description cannot exceed 4000 characters').optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assignedToId: z.string().uuid('Invalid assigned user ID format').optional().nullable(),
  leadId: z.string().uuid('Invalid lead ID format').optional().nullable(),
  accountId: z.string().uuid('Invalid account ID format').optional().nullable(),
  contactId: z.string().uuid('Invalid contact ID format').optional().nullable(),
  opportunityId: z.string().uuid('Invalid opportunity ID format').optional().nullable()
});

export const changeTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, COMPLETED, CANCELLED' })
  })
});

export const updateTaskStatusSchema = changeTaskStatusSchema;

export const assignTaskSchema = z.object({
  assignedToId: z.string().uuid('Invalid assigned user ID format').nullable()
});

export const getTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  overdue: z.coerce.boolean().optional(),
  dueToday: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'status', 'createdAt', 'title']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChangeTaskStatusInput = z.infer<typeof changeTaskStatusSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
