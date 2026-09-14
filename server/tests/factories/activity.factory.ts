import { prismaTest } from '../helpers/testDb.js';
import { ActivityType } from '@prisma/client';
import crypto from 'crypto';

export interface CreateActivityOptions {
  organizationId: string;
  createdById: string;
  type?: ActivityType;
  subject?: string;
  description?: string | null;
  activityDate?: Date;
  duration?: number | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
}

export async function createTestActivity(options: CreateActivityOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const subject = options.subject || `Call with client ${uid}`;

  return prismaTest.activity.create({
    data: {
      organizationId: options.organizationId,
      createdById: options.createdById,
      type: options.type || ActivityType.CALL,
      subject,
      description: options.description !== undefined ? options.description : 'Discussed contract scope and deliverables',
      activityDate: options.activityDate || new Date(),
      duration: options.duration !== undefined ? options.duration : 30,
      leadId: options.leadId || null,
      accountId: options.accountId || null,
      contactId: options.contactId || null,
      opportunityId: options.opportunityId || null
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true, company: true } },
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      opportunity: { select: { id: true, name: true } }
    }
  });
}
