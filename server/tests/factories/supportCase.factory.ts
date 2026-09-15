import { prismaTest } from '../helpers/testDb.js';
import { SupportCasePriority, SupportCaseStatus } from '@prisma/client';
import crypto from 'crypto';

export interface CreateSupportCaseOptions {
  organizationId: string;
  createdById: string;
  subject?: string;
  description?: string | null;
  priority?: SupportCasePriority;
  status?: SupportCaseStatus;
  accountId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
  resolution?: string | null;
  resolvedAt?: Date | null;
}

export async function createTestSupportCase(options: CreateSupportCaseOptions) {
  const uid = crypto.randomUUID().slice(0, 8);

  return prismaTest.supportCase.create({
    data: {
      organizationId: options.organizationId,
      createdById: options.createdById,
      subject: options.subject || `Customer issue ticket ${uid}`,
      description: options.description !== undefined ? options.description : 'Details describing customer ticket issue',
      priority: options.priority || SupportCasePriority.MEDIUM,
      status: options.status || SupportCaseStatus.OPEN,
      accountId: options.accountId || null,
      contactId: options.contactId || null,
      assignedToId: options.assignedToId || null,
      resolution: options.resolution || null,
      resolvedAt: options.resolvedAt || null
    }
  });
}
