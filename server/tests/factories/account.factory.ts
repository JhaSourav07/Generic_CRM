import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateAccountOptions {
  organizationId: string;
  ownerId?: string;
  name?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  status?: string;
  notes?: string;
}

export async function createTestAccount(options: CreateAccountOptions) {
  const uid = crypto.randomUUID();
  const name = options.name || `Acme_Corp_${uid.slice(0, 8)}`;
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = options.email !== undefined ? options.email : `account_${uid.slice(0, 8)}@${nameSlug}.com`;

  return prismaTest.account.create({
    data: {
      organizationId: options.organizationId,
      ownerId: options.ownerId || null,
      name,
      industry: options.industry || 'Technology',
      website: options.website || `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      email,
      phone: options.phone || '+1 555-019-2834',
      status: options.status || 'active',
      notes: options.notes || 'Test customer account'
    }
  });
}
