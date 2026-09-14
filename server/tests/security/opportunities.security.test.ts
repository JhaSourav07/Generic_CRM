import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Opportunity Security, IDOR & Multi-Tenancy Attacks (security)', () => {
  let orgA: any;
  let userA: any;
  let tokenA: string;
  let pipelineA: any;
  let accountA: any;
  let oppA: any;

  let orgB: any;
  let userB: any;
  let tokenB: string;
  let pipelineB: any;
  let accountB: any;
  let contactB: any;
  let oppB: any;

  beforeEach(async () => {
    await clearTestDb();

    // Setup Org A
    orgA = await createTestOrg();
    const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'admin@orga.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });
    pipelineA = await createTestPipeline({ organizationId: orgA.id, isDefault: true });
    accountA = await createTestAccount({ organizationId: orgA.id, name: 'Org A Client' });
    oppA = await createTestOpportunity({
      organizationId: orgA.id,
      pipelineId: pipelineA.id,
      stageId: pipelineA.stages[0].id,
      accountId: accountA.id,
      name: 'Org A Confidential Deal',
      value: 100000
    });

    // Setup Org B
    orgB = await createTestOrg();
    const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'admin@orgb.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
    pipelineB = await createTestPipeline({ organizationId: orgB.id, isDefault: true });
    accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Client' });
    contactB = await createTestContact({ organizationId: orgB.id, accountId: accountB.id, firstName: 'Bob', lastName: 'OrgB' });
    oppB = await createTestOpportunity({
      organizationId: orgB.id,
      pipelineId: pipelineB.id,
      stageId: pipelineB.stages[0].id,
      accountId: accountB.id,
      contactId: contactB.id,
      name: 'Org B Secret Deal',
      value: 200000
    });
  });

  describe('IDOR Cross-Tenant Access Prevention', () => {
    it('should block Org A user from accessing Org B opportunity via GET', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${oppB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from updating Org B opportunity via PATCH', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${oppB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ name: 'Hacked Deal' });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from changing stage of Org B opportunity', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${oppB.id}/stage`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ stageId: pipelineB.stages[1].id });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from assigning Org B opportunity', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${oppB.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ ownerId: userA.id });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from winning Org B opportunity', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${oppB.id}/win`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from losing Org B opportunity', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${oppB.id}/lose`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ reason: 'Malicious' });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from deleting Org B opportunity', async () => {
      const res = await request(app)
        .delete(`/api/opportunities/${oppB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from accessing Org B pipeline board', async () => {
      const res = await request(app)
        .get(`/api/pipelines/${pipelineB.id}/board`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('Cross-Tenant Entity Injection Rejection', () => {
    it('should reject Org A creating an opportunity referencing Org B Account', async () => {
      const payload = {
        name: 'Injected Account Deal',
        accountId: accountB.id,
        pipelineId: pipelineA.id,
        stageId: pipelineA.stages[0].id
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ACCOUNT');
    });

    it('should reject Org A creating an opportunity referencing Org B Contact', async () => {
      const payload = {
        name: 'Injected Contact Deal',
        contactId: contactB.id,
        pipelineId: pipelineA.id,
        stageId: pipelineA.stages[0].id
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CONTACT');
    });

    it('should reject Org A creating an opportunity referencing Org B Pipeline and Stage', async () => {
      const payload = {
        name: 'Injected Pipeline Deal',
        pipelineId: pipelineB.id,
        stageId: pipelineB.stages[0].id
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PIPELINE');
    });

    it('should reject assigning an opportunity to a user in a different organization', async () => {
      const res = await request(app)
        .patch(`/api/opportunities/${oppA.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ ownerId: userB.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OWNER');
    });
  });

  describe('Mass Assignment Prevention', () => {
    it('should not allow client to tamper with organizationId in payload', async () => {
      const payload = {
        name: 'Tampered Deal',
        organizationId: orgB.id, // malicious attempt to assign to Org B
        pipelineId: pipelineA.id,
        stageId: pipelineA.stages[0].id
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send(payload);

      expect(res.status).toBe(201);
      // Ensure the newly created record belongs to Org A, NOT Org B
      expect(res.body.data.organizationId).toBe(orgA.id);
    });
  });
});
