import { z } from 'zod';

export const reportFilterSchema = z.object({
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  ownerId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  source: z.string().optional(),
  type: z.string().optional(),
  pipelineId: z.string().uuid().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

export const exportReportParamsSchema = z.object({
  reportType: z.enum([
    'overview',
    'leads',
    'sales',
    'pipeline',
    'activities',
    'tasks',
    'support',
    'campaigns'
  ])
});

export type ReportFilterQuery = z.infer<typeof reportFilterSchema>;
export type ExportReportParams = z.infer<typeof exportReportParamsSchema>;
