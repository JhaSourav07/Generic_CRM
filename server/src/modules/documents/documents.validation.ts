import { z } from 'zod';

export const listDocumentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  mimeType: z.string().optional(),
  leadId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  supportCaseId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'name', 'size']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const uploadDocumentMetadataSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .refine((val) => !val.includes('..') && !val.includes('/') && !val.includes('\\') && !val.includes('\0'), {
      message: 'Document name cannot contain path traversal sequences or slashes'
    })
    .optional(),
  leadId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  quoteId: z.string().uuid().optional().nullable(),
  orderId: z.string().uuid().optional().nullable(),
  supportCaseId: z.string().uuid().optional().nullable()
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional()
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsSchema>;
export type UploadDocumentMetadata = z.infer<typeof uploadDocumentMetadataSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
