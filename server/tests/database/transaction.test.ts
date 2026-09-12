import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { Prisma } from '@prisma/client';

describe('Database Transaction Atomicity (database)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('should guarantee 100% rollback of all operations if any transaction step fails', async () => {
    const initialOrgCount = await prismaTest.organization.count();
    const initialUserCount = await prismaTest.user.count();
    const initialPipelineCount = await prismaTest.pipeline.count();

    expect(initialOrgCount).toBe(0);
    expect(initialUserCount).toBe(0);
    expect(initialPipelineCount).toBe(0);

    // Attempt a transaction where step 1 creates Org, step 2 creates User, step 3 fails intentionally
    try {
      await prismaTest.$transaction(async (tx: Prisma.TransactionClient) => {
        const org = await tx.organization.create({
          data: { name: 'Rollback Org', slug: 'rollback-org' }
        });

        const role = await tx.role.create({
          data: { organizationId: org.id, name: 'ADMIN' }
        });

        await tx.user.create({
          data: {
            organizationId: org.id,
            roleId: role.id,
            name: 'Rollback User',
            email: 'rollback@test.com',
            passwordHash: 'dummy-hash'
          }
        });

        // Intentional forced failure in step 3
        throw new Error('INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
      });
    } catch (err: any) {
      expect(err.message).toBe('INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
    }

    // Verify complete atomicity: no partial records saved in DB
    const finalOrgCount = await prismaTest.organization.count();
    const finalUserCount = await prismaTest.user.count();
    const finalPipelineCount = await prismaTest.pipeline.count();

    expect(finalOrgCount).toBe(0);
    expect(finalUserCount).toBe(0);
    expect(finalPipelineCount).toBe(0);
  });
});
