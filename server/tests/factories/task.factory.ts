import { prismaTest } from '../helpers/testDb.js';
import { TaskStatus, TaskPriority } from '@prisma/client';
import crypto from 'crypto';

export interface CreateTaskOptions {
  organizationId: string;
  createdById: string;
  assignedToId?: string | null;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  completedAt?: Date | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
}

export async function createTestTask(options: CreateTaskOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const title = options.title || `Follow-up call ${uid}`;

  return prismaTest.task.create({
    data: {
      organizationId: options.organizationId,
      createdById: options.createdById,
      assignedToId: options.assignedToId || null,
      title,
      description: options.description !== undefined ? options.description : 'Follow up with decision makers regarding proposal',
      status: options.status || TaskStatus.TODO,
      priority: options.priority || TaskPriority.MEDIUM,
      dueDate: options.dueDate !== undefined ? options.dueDate : new Date(Date.now() + 24 * 60 * 60 * 1000),
      completedAt: options.completedAt || null,
      leadId: options.leadId || null,
      accountId: options.accountId || null,
      contactId: options.contactId || null,
      opportunityId: options.opportunityId || null
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true, company: true } },
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      opportunity: { select: { id: true, name: true } }
    }
  });
}
