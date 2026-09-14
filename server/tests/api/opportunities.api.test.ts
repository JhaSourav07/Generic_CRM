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
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Opportunity API Routes (/api/opportunities) (API integration)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;
  let pipeline: any;
  let account: any;
  let contact: any;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: superAdminRole.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: user.email
    });

    pipeline = await createTestPipeline({ organizationId: org.id, isDefault: true });
    account = await createTestAccount({ organizationId: org.id, name: 'Acme Global Corp' });
    contact = await createTestContact({ organizationId: org.id, accountId: account.id, firstName: 'Jane', lastName: 'Doe' });
  });

  describe('GET /api/opportunities', () => {
    it('should return 401 UNAUTHORIZED when no token provided', async () => {
      const res = await request(app).get('/api/opportunities');
      expect(res.status).toBe(401);
    });

    it('should list opportunities with pagination metadata', async () => {
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        name: 'Opportunity Alpha',
        value: 15000
      });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[1].id,
        name: 'Opportunity Beta',
        value: 25000
      });

      const res = await request(app)
        .get('/api/opportunities')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter opportunities by pipeline, stage, and status', async () => {
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        name: 'Open Opp 1',
        status: 'OPEN'
      });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[3].id,
        name: 'Won Opp',
        status: 'WON'
      });

      const res = await request(app)
        .get(`/api/opportunities?status=WON&stageId=${pipeline.stages[3].id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Won Opp');
    });

    it('should perform server-side search across deal, account, contact, and owner', async () => {
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        name: 'Mega Enterprise Cloud Migration',
        accountId: account.id,
        contactId: contact.id
      });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        name: 'Small Widget Purchase'
      });

      const res = await request(app)
        .get('/api/opportunities?search=Cloud Migration')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Mega Enterprise Cloud Migration');
    });
  });

  describe('POST /api/opportunities', () => {
    it('should create opportunity successfully with valid relations', async () => {
      const payload = {
        name: 'New SaaS Contract',
        description: '3-year enterprise license',
        accountId: account.id,
        contactId: contact.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 54000.50,
        probability: 0.25,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New SaaS Contract');
      expect(res.body.data.value).toBe(54000.50);
      expect(res.body.data.status).toBe('OPEN');
    });

    it('should reject creation when contact does not belong to selected account', async () => {
      const otherAccount = await createTestAccount({ organizationId: org.id, name: 'Other Account Ltd' });

      const payload = {
        name: 'Mismatched Deal',
        accountId: otherAccount.id,
        contactId: contact.id, // belongs to account, not otherAccount
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 10000
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('selected contact does not belong to the selected customer');
    });

    it('should reject creation when stage does not belong to pipeline', async () => {
      const otherPipeline = await createTestPipeline({ organizationId: org.id, name: 'Other Pipeline' });

      const payload = {
        name: 'Invalid Stage Deal',
        pipelineId: pipeline.id,
        stageId: otherPipeline.stages[0].id,
        value: 10000
      };

      const res = await request(app)
        .post('/api/opportunities')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Pipeline stage does not belong');
    });
  });

  describe('GET /api/opportunities/:id', () => {
    it('should return opportunity details with relationships', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        accountId: account.id,
        contactId: contact.id,
        name: 'Detail Inspection Deal'
      });

      const res = await request(app)
        .get(`/api/opportunities/${opp.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(opp.id);
      expect(res.body.data.account.name).toBe('Acme Global Corp');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const res = await request(app)
        .get('/api/opportunities/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/opportunities/:id', () => {
    it('should update opportunity details', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        name: 'Original Name',
        value: 10000
      });

      const res = await request(app)
        .patch(`/api/opportunities/${opp.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          name: 'Updated Deal Name',
          value: 20000,
          description: 'Updated comprehensive description',
          probability: 0.75,
          expectedCloseDate: '2026-12-31'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Deal Name');
      expect(res.body.data.value).toBe(20000);
      expect(res.body.data.description).toBe('Updated comprehensive description');
      expect(res.body.data.probability).toBe(0.75);
      expect(res.body.data.expectedCloseDate).toContain('2026-12-31');
    });
  });

  describe('PATCH /api/opportunities/:id/stage', () => {
    it('should transition opportunity stage in same pipeline and record audit log', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id
      });

      const targetStage = pipeline.stages[2]; // Negotiation

      const res = await request(app)
        .patch(`/api/opportunities/${opp.id}/stage`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ stageId: targetStage.id });

      expect(res.status).toBe(200);
      expect(res.body.data.stageId).toBe(targetStage.id);

      // Verify audit log created
      const auditLog = await prismaTest.auditLog.findFirst({
        where: { entity: 'Opportunity', entityId: opp.id, action: 'OPPORTUNITY_STAGE_CHANGED' }
      });
      expect(auditLog).not.toBeNull();
      expect((auditLog?.newValue as any)?.stageName).toBe(targetStage.name);
    });

    it('should reject transition if stage belongs to different pipeline', async () => {
      const otherPipeline = await createTestPipeline({ organizationId: org.id, name: 'Other Line' });
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id
      });

      const res = await request(app)
        .patch(`/api/opportunities/${opp.id}/stage`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ stageId: otherPipeline.stages[0].id });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Target stage does not belong');
    });
  });

  describe('PATCH /api/opportunities/:id/assign', () => {
    it('should assign opportunity to an active organization user', async () => {
      const salesRepRole = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });
      const salesRep = await createTestUser({ organizationId: org.id, roleId: salesRepRole.id, email: 'rep@acme.com' });
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        ownerId: user.id
      });

      const res = await request(app)
        .patch(`/api/opportunities/${opp.id}/assign`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ ownerId: salesRep.id });

      expect(res.status).toBe(200);
      expect(res.body.data.owner.id).toBe(salesRep.id);
    });
  });

  describe('POST /api/opportunities/:id/win and /lose', () => {
    it('should mark opportunity as WON with closedAt timestamp', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        status: 'OPEN'
      });

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/win`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('WON');
      expect(res.body.data.closedAt).not.toBeNull();

      // Second win attempt should fail
      const repeatRes = await request(app)
        .post(`/api/opportunities/${opp.id}/win`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(repeatRes.status).toBe(400);
      expect(repeatRes.body.error.code).toBe('ALREADY_WON');
    });

    it('should mark opportunity as LOST with reason and closedAt timestamp', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        status: 'OPEN'
      });

      const res = await request(app)
        .post(`/api/opportunities/${opp.id}/lose`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ reason: 'Competitor price lower' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('LOST');
      expect(res.body.data.lostReason).toBe('Competitor price lower');
      expect(res.body.data.closedAt).not.toBeNull();

      // Second lose attempt should fail
      const repeatRes = await request(app)
        .post(`/api/opportunities/${opp.id}/lose`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ reason: 'Duplicate' });

      expect(repeatRes.status).toBe(400);
      expect(repeatRes.body.error.code).toBe('ALREADY_LOST');
    });
  });

  describe('DELETE /api/opportunities/:id', () => {
    it('should soft delete opportunity', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id
      });

      const res = await request(app)
        .delete(`/api/opportunities/${opp.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);

      const dbOpp = await prismaTest.opportunity.findUnique({ where: { id: opp.id } });
      expect(dbOpp?.deletedAt).not.toBeNull();
    });
  });
});
