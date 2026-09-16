import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { createTestOrder } from '../factories/order.factory.js';
import { createTestSupportCase } from '../factories/supportCase.factory.js';
import { createTestDocument } from '../factories/document.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';
import { OrderStatus, QuoteStatus } from '@prisma/client';

describe('Multi-Module Ownership & Authorization Rules (security)', () => {
  let org: any;
  let repRole: any;
  let managerRole: any;
  let superAdminRole: any;
  let userAlice: any; // Sales Rep A
  let userBob: any;   // Sales Rep B
  let userManager: any; // Sales Manager
  let userAdmin: any; // Super Admin
  let tokenAlice: string;
  let tokenBob: string;
  let tokenManager: string;
  let tokenAdmin: string;
  let pipeline: any;
  let stage: any;

  async function grantAllPermissions(roleId: string, resources: string[]) {
    const actions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'CONVERT', 'APPROVE', 'EXPORT'];
    for (const resource of resources) {
      for (const action of actions) {
        let perm = await prismaTest.permission.findFirst({
          where: { resource, action }
        });
        if (!perm) {
          perm = await prismaTest.permission.create({
            data: { resource, action, description: `${resource} ${action}` }
          });
        }
        await prismaTest.rolePermission.create({
          data: { roleId, permissionId: perm.id }
        });
      }
    }
  }

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    pipeline = await createTestPipeline({ organizationId: org.id });
    stage = pipeline.stages[0];

    repRole = await createTestRole({ organizationId: org.id, name: 'SALES_REPRESENTATIVE' });
    managerRole = await createTestRole({ organizationId: org.id, name: 'SALES_MANAGER' });
    superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });

    const resources = ['leads', 'opportunities', 'quotes', 'orders', 'support_cases', 'documents', 'campaigns', 'users'];
    await grantAllPermissions(repRole.id, resources);
    await grantAllPermissions(managerRole.id, resources);

    userAlice = await createTestUser({
      organizationId: org.id,
      roleId: repRole.id,
      email: 'alice@vynexa.com'
    });
    tokenAlice = authService.generateToken({
      userId: userAlice.id,
      organizationId: org.id,
      roleId: repRole.id,
      roleName: repRole.name,
      email: userAlice.email
    });

    userBob = await createTestUser({
      organizationId: org.id,
      roleId: repRole.id,
      email: 'bob@vynexa.com'
    });
    tokenBob = authService.generateToken({
      userId: userBob.id,
      organizationId: org.id,
      roleId: repRole.id,
      roleName: repRole.name,
      email: userBob.email
    });

    userManager = await createTestUser({
      organizationId: org.id,
      roleId: managerRole.id,
      email: 'manager@vynexa.com'
    });
    tokenManager = authService.generateToken({
      userId: userManager.id,
      organizationId: org.id,
      roleId: managerRole.id,
      roleName: managerRole.name,
      email: userManager.email
    });

    userAdmin = await createTestUser({
      organizationId: org.id,
      roleId: superAdminRole.id,
      email: 'admin@vynexa.com'
    });
    tokenAdmin = authService.generateToken({
      userId: userAdmin.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: userAdmin.email
    });
  });

  describe('Leads Ownership Enforcement', () => {
    it("should block User Bob from reassigning User Alice's lead with 403 FORBIDDEN", async () => {
      const lead = await createTestLead({
        organizationId: org.id,
        ownerId: userAlice.id,
        firstName: 'Prospect',
        lastName: 'One'
      });

      const res = await request(app)
        .patch(`/api/leads/${lead.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ ownerId: userBob.id });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow Sales Manager to reassign Alice's lead to Bob", async () => {
      const lead = await createTestLead({
        organizationId: org.id,
        ownerId: userAlice.id,
        firstName: 'Prospect',
        lastName: 'One'
      });

      const res = await request(app)
        .patch(`/api/leads/${lead.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenManager}`])
        .send({ ownerId: userBob.id });

      expect(res.status).toBe(200);
      expect(res.body.data.ownerId).toBe(userBob.id);
    });

    it("should block User Bob from converting User Alice's lead", async () => {
      const lead = await createTestLead({
        organizationId: org.id,
        ownerId: userAlice.id,
        firstName: 'Prospect',
        lastName: 'Two'
      });

      const res = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ dealName: 'Converted Deal', dealValue: 10000 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Opportunities Ownership Enforcement', () => {
    it("should block User Bob from winning User Alice's opportunity with 403 FORBIDDEN", async () => {
      const account = await createTestAccount({ organizationId: org.id, name: 'Acme Corp' });
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        accountId: account.id,
        ownerId: userAlice.id,
        name: 'Enterprise License Deal'
      });

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/win`)
        .set('Cookie', [`vynexa_token=${tokenBob}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow User Alice (owner) to win her own opportunity", async () => {
      const account = await createTestAccount({ organizationId: org.id, name: 'Acme Corp' });
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        accountId: account.id,
        ownerId: userAlice.id,
        name: 'Enterprise License Deal'
      });

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/win`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('WON');
    });

    it("should allow Sales Manager to win Alice's opportunity", async () => {
      const account = await createTestAccount({ organizationId: org.id, name: 'Acme Corp' });
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        accountId: account.id,
        ownerId: userAlice.id,
        name: 'Enterprise License Deal'
      });

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/win`)
        .set('Cookie', [`vynexa_token=${tokenManager}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('WON');
    });
  });

  describe('Quotes Approval Authorization', () => {
    it('should block sales reps from approving quotes (requires manager authorization)', async () => {
      const quote = await createTestQuote({
        organizationId: org.id,
        createdById: userAlice.id,
        status: QuoteStatus.DRAFT
      });

      const res = await request(app)
        .post(`/api/quotes/${quote.id}/approve`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Managerial authorization is required');
    });

    it('should allow Sales Manager to approve quote', async () => {
      const quote = await createTestQuote({
        organizationId: org.id,
        createdById: userAlice.id,
        status: QuoteStatus.DRAFT
      });

      const res = await request(app)
        .post(`/api/quotes/${quote.id}/approve`)
        .set('Cookie', [`vynexa_token=${tokenManager}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('Orders Workflow Authorization', () => {
    it('should block sales reps from confirming orders (requires operations/manager)', async () => {
      const order = await createTestOrder({
        organizationId: org.id,
        createdById: userAlice.id,
        status: OrderStatus.PENDING
      });

      const res = await request(app)
        .post(`/api/orders/${order.id}/confirm`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow Sales Manager to confirm order', async () => {
      const order = await createTestOrder({
        organizationId: org.id,
        createdById: userAlice.id,
        status: OrderStatus.PENDING
      });

      const res = await request(app)
        .post(`/api/orders/${order.id}/confirm`)
        .set('Cookie', [`vynexa_token=${tokenManager}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
    });
  });

  describe('Support Cases Ownership Enforcement', () => {
    it("should block User Bob from resolving User Alice's support case with 403 FORBIDDEN", async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: userAlice.id,
        assignedToId: userAlice.id,
        subject: 'Database connection issue'
      });

      const res = await request(app)
        .post(`/api/support-cases/${supportCase.id}/resolve`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ resolution: 'Solved by Bob' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow assigned agent Alice to resolve her own support case", async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: userAlice.id,
        assignedToId: userAlice.id,
        subject: 'Database connection issue'
      });

      const res = await request(app)
        .post(`/api/support-cases/${supportCase.id}/resolve`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`])
        .send({ resolution: 'Fixed index and increased pool' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });

  describe('Documents Ownership Enforcement', () => {
    it("should block User Bob from updating or deleting User Alice's document", async () => {
      const doc = await createTestDocument({
        organizationId: org.id,
        uploadedById: userAlice.id,
        name: "Alice's Proposal.pdf"
      });

      const updateRes = await request(app)
        .patch(`/api/documents/${doc.id}`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ name: 'Tampered Document.pdf' });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.error.code).toBe('FORBIDDEN');

      const deleteRes = await request(app)
        .delete(`/api/documents/${doc.id}`)
        .set('Cookie', [`vynexa_token=${tokenBob}`]);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow uploader Alice to update and delete her document", async () => {
      const doc = await createTestDocument({
        organizationId: org.id,
        uploadedById: userAlice.id,
        name: "Alice's Proposal.pdf"
      });

      const updateRes = await request(app)
        .patch(`/api/documents/${doc.id}`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`])
        .send({ name: 'Alice Proposal Final.pdf' });

      expect(updateRes.status).toBe(200);

      const deleteRes = await request(app)
        .delete(`/api/documents/${doc.id}`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`]);

      expect(deleteRes.status).toBe(200);
    });
  });

  describe('User Self-Protection Rules', () => {
    it('should prevent a user from changing their own role with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .put(`/api/users/${userAlice.id}`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`])
        .send({ roleId: managerRole.id });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('You cannot modify your own role');
    });

    it('should prevent a user from deactivating their own account with 400 CANNOT_DEACTIVATE_SELF', async () => {
      const res = await request(app)
        .patch(`/api/users/${userAlice.id}/status`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`])
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
    });
  });
});
