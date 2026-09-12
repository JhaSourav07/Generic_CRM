import { prismaTest } from '../helpers/testDb.js';

export interface CreateOrgOptions {
  name?: string;
  slug?: string;
  email?: string;
  currency?: string;
}

export async function createTestOrg(options: CreateOrgOptions = {}) {
  const timestamp = Date.now() + Math.floor(Math.random() * 100000);
  const name = options.name || `Test Organization ${timestamp}`;
  const slug = options.slug || `test-org-${timestamp}`;

  return prismaTest.organization.create({
    data: {
      name,
      slug,
      email: options.email || `contact@${slug}.com`,
      currency: options.currency || 'USD'
    }
  });
}
