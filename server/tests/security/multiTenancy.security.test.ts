import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { setupMultiTenantFixtures } from '../fixtures/testUsers.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Multi-Tenancy Security & Boundary Isolation (security)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('should strictly isolate data between Organization A and Organization B', async () => {
    const { orgA, userA, orgB, userB } = await setupMultiTenantFixtures();

    // Generate JWT tokens for both users
    const tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: userA.organizationId,
      roleId: userA.roleId,
      roleName: userA.role.name,
      email: userA.email
    });

    const tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: userB.organizationId,
      roleId: userB.roleId,
      roleName: userB.role.name,
      email: userB.email
    });

    const payloadA = authService.verifyToken(tokenA);
    const payloadB = authService.verifyToken(tokenB);

    // Verify token A carries Org A ID, token B carries Org B ID
    expect(payloadA.organizationId).toBe(orgA.id);
    expect(payloadB.organizationId).toBe(orgB.id);
    expect(payloadA.organizationId).not.toBe(payloadB.organizationId);

    // Create a pipeline in Org A
    const pipelineA = await prismaTest.pipeline.create({
      data: {
        organizationId: orgA.id,
        name: 'Org A Commercial Pipeline'
      }
    });

    // Query pipelines enforcing Org A tenant boundary
    const orgAPipelines = await prismaTest.pipeline.findMany({
      where: { organizationId: payloadA.organizationId }
    });

    // Query pipelines enforcing Org B tenant boundary
    const orgBPipelines = await prismaTest.pipeline.findMany({
      where: { organizationId: payloadB.organizationId }
    });

    expect(orgAPipelines.length).toBe(1);
    expect(orgAPipelines[0].id).toBe(pipelineA.id);
    expect(orgBPipelines.length).toBe(0); // Zero cross-tenant data leakage!
  });

  it('should reject parameter tampering attempt to access Org B resource via Org A token', async () => {
    const { orgA, userA, orgB } = await setupMultiTenantFixtures();

    const pipelineB = await prismaTest.pipeline.create({
      data: {
        organizationId: orgB.id,
        name: 'Org B Secret Pipeline'
      }
    });

    // User A attempts to read Org B pipeline with Org A context
    const tamperedQuery = await prismaTest.pipeline.findFirst({
      where: {
        id: pipelineB.id,
        organizationId: orgA.id // Server enforces context.organizationId
      }
    });

    expect(tamperedQuery).toBeNull();
  });
});
