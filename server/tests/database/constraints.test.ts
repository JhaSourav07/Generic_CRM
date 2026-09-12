import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';

describe('Database Constraints & Relational Integrity (database)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('should enforce unique constraint on Organization slug', async () => {
    await createTestOrg({ name: 'Org 1', slug: 'unique-slug' });

    await expect(
      createTestOrg({ name: 'Org 2', slug: 'unique-slug' })
    ).rejects.toThrow();
  });

  it('should enforce unique constraint on User (organizationId + email)', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });

    await createTestUser({
      organizationId: org.id,
      roleId: role.id,
      email: 'unique@test.com'
    });

    await expect(
      createTestUser({
        organizationId: org.id,
        roleId: role.id,
        email: 'unique@test.com'
      })
    ).rejects.toThrow();
  });

  it('should allow identical emails across different organizations (multi-tenant boundary)', async () => {
    const org1 = await createTestOrg({ slug: 'tenant-1' });
    const role1 = await createTestRole({ organizationId: org1.id });
    const user1 = await createTestUser({
      organizationId: org1.id,
      roleId: role1.id,
      email: 'shared@business.com'
    });

    const org2 = await createTestOrg({ slug: 'tenant-2' });
    const role2 = await createTestRole({ organizationId: org2.id });
    const user2 = await createTestUser({
      organizationId: org2.id,
      roleId: role2.id,
      email: 'shared@business.com'
    });

    expect(user1.id).not.toBe(user2.id);
    expect(user1.organizationId).toBe(org1.id);
    expect(user2.organizationId).toBe(org2.id);
  });
});
