import { prismaTest } from '../helpers/testDb.js';
import { LeadStatus } from '@prisma/client';
import crypto from 'crypto';

export interface CreateLeadOptions {
  organizationId: string;
  ownerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  status?: LeadStatus;
  score?: number;
  source?: string;
}

export async function createTestLead(options: CreateLeadOptions) {
  const uid = crypto.randomUUID();
  const firstName = options.firstName || `John_${uid.slice(0, 8)}`;
  const lastName = options.lastName || `Doe_${uid.slice(0, 8)}`;
  const email = options.email !== undefined ? options.email : `lead_${uid.slice(0, 8)}@test.com`;

  return prismaTest.lead.create({
    data: {
      organizationId: options.organizationId,
      ownerId: options.ownerId || null,
      firstName,
      lastName,
      email,
      company: options.company || `Company_${uid.slice(0, 8)}`,
      status: options.status || LeadStatus.NEW,
      score: options.score ?? 50,
      source: options.source || 'Inbound Webform'
    }
  });
}
