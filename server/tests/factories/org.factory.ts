import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateOrgOptions {
  name?: string;
  slug?: string;
  email?: string;
  currency?: string;
}

export async function createTestOrg(options: CreateOrgOptions = {}) {
  const uid = crypto.randomUUID();
  const name = options.name || `Test Organization ${uid}`;
  const slug = options.slug || `test-org-${uid}`;

  return prismaTest.organization.create({
    data: {
      name,
      slug,
      email: options.email || `contact-${uid}@test.com`,
      currency: options.currency || 'USD'
    }
  });
}
