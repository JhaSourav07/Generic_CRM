import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreatePipelineOptions {
  organizationId: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  stages?: {
    name: string;
    order: number;
    probability?: number;
  }[];
}

export async function createTestPipeline(options: CreatePipelineOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const name = options.name || `Sales Pipeline ${uid}`;

  const defaultStages = [
    { name: 'Qualification', order: 1, probability: 0.2 },
    { name: 'Value Proposal', order: 2, probability: 0.4 },
    { name: 'Negotiation', order: 3, probability: 0.7 },
    { name: 'Closed Won', order: 4, probability: 1.0 },
    { name: 'Closed Lost', order: 5, probability: 0.0 }
  ];

  const stagesToCreate = options.stages || defaultStages;

  return prismaTest.pipeline.create({
    data: {
      organizationId: options.organizationId,
      name,
      description: options.description || 'Standard sales pipeline',
      isDefault: options.isDefault ?? false,
      stages: {
        create: stagesToCreate
      }
    },
    include: {
      stages: {
        orderBy: { order: 'asc' }
      }
    }
  });
}
