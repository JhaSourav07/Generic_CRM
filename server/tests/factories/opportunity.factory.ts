import { prismaTest } from '../helpers/testDb.js';
import { OpportunityStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface CreateOpportunityOptions {
  organizationId: string;
  pipelineId: string;
  stageId: string;
  accountId?: string | null;
  contactId?: string | null;
  ownerId?: string | null;
  name?: string;
  description?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: Date | null;
  status?: OpportunityStatus;
  lostReason?: string | null;
}

export async function createTestOpportunity(options: CreateOpportunityOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const name = options.name || `Opportunity Deal ${uid}`;

  return prismaTest.opportunity.create({
    data: {
      organizationId: options.organizationId,
      pipelineId: options.pipelineId,
      stageId: options.stageId,
      accountId: options.accountId || null,
      contactId: options.contactId || null,
      ownerId: options.ownerId || null,
      name,
      description: options.description || 'Enterprise contract negotiation',
      value: new Prisma.Decimal(options.value !== undefined ? options.value : 10000.00),
      probability: options.probability !== undefined ? options.probability : 0.5,
      expectedCloseDate: options.expectedCloseDate !== undefined
        ? options.expectedCloseDate
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: options.status || OpportunityStatus.OPEN,
      lostReason: options.lostReason || null
    },
    include: {
      account: true,
      contact: true,
      owner: true,
      pipeline: true,
      stage: true
    }
  });
}
