import { prismaTest } from '../helpers/testDb.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface CreateCampaignOptions {
  organizationId: string;
  createdById: string;
  name?: string;
  description?: string | null;
  type?: string | null;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: number | null;
}

export async function createTestCampaign(options: CreateCampaignOptions) {
  const uid = crypto.randomUUID().slice(0, 8);

  return prismaTest.campaign.create({
    data: {
      organizationId: options.organizationId,
      createdById: options.createdById,
      name: options.name || `Marketing Campaign ${uid}`,
      description: options.description !== undefined ? options.description : 'Test campaign description',
      type: options.type !== undefined ? options.type : 'EMAIL',
      status: options.status || 'PLANNING',
      startDate: options.startDate !== undefined ? options.startDate : new Date(),
      endDate: options.endDate !== undefined ? options.endDate : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: options.budget !== undefined && options.budget !== null ? new Prisma.Decimal(options.budget) : new Prisma.Decimal(5000)
    }
  });
}

export async function createTestCampaignLead(campaignId: string, leadId: string) {
  return prismaTest.campaignLead.create({
    data: {
      campaignId,
      leadId
    }
  });
}
