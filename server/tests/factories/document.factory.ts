import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateDocumentOptions {
  organizationId: string;
  uploadedById: string;
  name?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  quoteId?: string | null;
  orderId?: string | null;
  supportCaseId?: string | null;
}

export async function createTestDocument(options: CreateDocumentOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const originalName = options.originalName || `sample_${uid}.pdf`;
  const name = options.name || `Document ${uid}`;

  return prismaTest.document.create({
    data: {
      organizationId: options.organizationId,
      uploadedById: options.uploadedById,
      name,
      originalName,
      mimeType: options.mimeType || 'application/pdf',
      size: options.size !== undefined ? options.size : 1024,
      storageKey: options.storageKey || `${crypto.randomUUID()}.pdf`,
      leadId: options.leadId || null,
      accountId: options.accountId || null,
      contactId: options.contactId || null,
      opportunityId: options.opportunityId || null,
      quoteId: options.quoteId || null,
      orderId: options.orderId || null,
      supportCaseId: options.supportCaseId || null
    }
  });
}
