import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateRoleOptions {
  organizationId?: string | null;
  name?: string;
  description?: string;
}

export async function createTestRole(options: CreateRoleOptions = {}) {
  const uid = crypto.randomUUID();
  const name = options.name || `ROLE_${uid}`;

  return prismaTest.role.create({
    data: {
      organizationId: options.organizationId ?? null,
      name,
      description: options.description || `Test role ${name}`
    }
  });
}
