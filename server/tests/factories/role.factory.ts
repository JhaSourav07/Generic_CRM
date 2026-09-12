import { prismaTest } from '../helpers/testDb.js';

export interface CreateRoleOptions {
  organizationId?: string | null;
  name?: string;
  description?: string;
}

export async function createTestRole(options: CreateRoleOptions = {}) {
  const timestamp = Date.now() + Math.floor(Math.random() * 100000);
  const name = options.name || `ROLE_${timestamp}`;

  return prismaTest.role.create({
    data: {
      organizationId: options.organizationId ?? null,
      name,
      description: options.description || `Test role ${name}`
    }
  });
}
