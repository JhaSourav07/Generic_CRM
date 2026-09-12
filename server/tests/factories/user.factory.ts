import { prismaTest } from '../helpers/testDb.js';
import bcrypt from 'bcryptjs';

export interface CreateUserOptions {
  organizationId: string;
  roleId: string;
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

export async function createTestUser(options: CreateUserOptions) {
  const timestamp = Date.now() + Math.floor(Math.random() * 100000);
  const name = options.name || `Test User ${timestamp}`;
  const email = (options.email || `user.${timestamp}@test.com`).toLowerCase().trim();
  const password = options.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  return prismaTest.user.create({
    data: {
      organizationId: options.organizationId,
      roleId: options.roleId,
      name,
      email,
      passwordHash,
      isActive: options.isActive ?? true
    },
    include: {
      organization: true,
      role: true
    }
  });
}
