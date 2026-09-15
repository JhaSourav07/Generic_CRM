import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestCampaign, createTestCampaignLead } from '../factories/campaign.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Marketing Campaigns API Routes (/api/campaigns)', () => {
  let org: any;
  let role: any;
  let user: any;
  let authToken: string;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: role.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: user.email
    });
  });

  describe('GET /api/campaigns', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/campaigns');
      expect(res.status).toBe(401);
    });

    it('should list campaigns with pagination and search metadata', async () => {
      await createTestCampaign({ organizationId: org.id, createdById: user.id, name: 'Q1 Product Launch' });
      await createTestCampaign({ organizationId: org.id, createdById: user.id, name: 'Black Friday Deals' });

      const res = await request(app)
        .get('/api/campaigns?search=Launch')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Q1 Product Launch');
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign successfully', async () => {
      const payload = {
        name: 'Enterprise Inbound 2026',
        description: 'Targeting enterprise SaaS buyers',
        type: 'EMAIL',
        budget: 15000,
        startDate: '2026-10-01',
        endDate: '2026-12-31'
      };

      const res = await request(app)
        .post('/api/campaigns')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.budget).toBe(15000);
      expect(res.body.data.status).toBe('PLANNING');
    });

    it('should reject invalid dates where end date is before start date', async () => {
      const payload = {
        name: 'Invalid Date Campaign',
        startDate: '2026-12-31',
        endDate: '2026-01-01'
      };

      const res = await request(app)
        .post('/api/campaigns')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/campaigns/:id', () => {
    it('should get campaign details with derived performance metrics', async () => {
      const campaign = await createTestCampaign({
        organizationId: org.id,
        createdById: user.id,
        name: 'Summer Outreach',
        budget: 5000
      });

      const lead1 = await createTestLead({ organizationId: org.id, status: 'QUALIFIED' });
      const lead2 = await createTestLead({ organizationId: org.id, status: 'CONVERTED' });

      await createTestCampaignLead(campaign.id, lead1.id);
      await createTestCampaignLead(campaign.id, lead2.id);

      const res = await request(app)
        .get(`/api/campaigns/${campaign.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(campaign.id);
      expect(res.body.data.metrics.totalLeads).toBe(2);
      expect(res.body.data.metrics.convertedLeads).toBe(1);
      expect(res.body.data.metrics.conversionRate).toBe(50);
      expect(res.body.data.metrics.leadsByStatus.QUALIFIED).toBe(1);
      expect(res.body.data.metrics.leadsByStatus.CONVERTED).toBe(1);
    });
  });

  describe('PATCH /api/campaigns/:id and Status Transitions', () => {
    it('should update campaign details and support lifecycle actions', async () => {
      const campaign = await createTestCampaign({ organizationId: org.id, createdById: user.id });

      // Update name
      const updateRes = await request(app)
        .patch(`/api/campaigns/${campaign.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ name: 'Updated Campaign Name', budget: 8500 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Campaign Name');
      expect(updateRes.body.data.budget).toBe(8500);

      // Activate
      const activateRes = await request(app)
        .post(`/api/campaigns/${campaign.id}/activate`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(activateRes.status).toBe(200);
      expect(activateRes.body.data.status).toBe('ACTIVE');

      // Pause
      const pauseRes = await request(app)
        .post(`/api/campaigns/${campaign.id}/pause`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe('PAUSED');

      // Complete
      const completeRes = await request(app)
        .post(`/api/campaigns/${campaign.id}/complete`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Campaign ↔ Lead Associations', () => {
    it('should add a lead to campaign and handle duplicate idempotently', async () => {
      const campaign = await createTestCampaign({ organizationId: org.id, createdById: user.id });
      const lead = await createTestLead({ organizationId: org.id });

      const res1 = await request(app)
        .post(`/api/campaigns/${campaign.id}/leads/${lead.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      // Duplicate add
      const res2 = await request(app)
        .post(`/api/campaigns/${campaign.id}/leads/${lead.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
    });

    it('should remove lead from campaign', async () => {
      const campaign = await createTestCampaign({ organizationId: org.id, createdById: user.id });
      const lead = await createTestLead({ organizationId: org.id });
      await createTestCampaignLead(campaign.id, lead.id);

      const res = await request(app)
        .delete(`/api/campaigns/${campaign.id}/leads/${lead.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should bulk add leads to campaign in transaction', async () => {
      const campaign = await createTestCampaign({ organizationId: org.id, createdById: user.id });
      const lead1 = await createTestLead({ organizationId: org.id });
      const lead2 = await createTestLead({ organizationId: org.id });
      const lead3 = await createTestLead({ organizationId: org.id });

      const res = await request(app)
        .post(`/api/campaigns/${campaign.id}/leads/bulk`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ leadIds: [lead1.id, lead2.id, lead3.id] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(3);

      // Get leads list
      const listRes = await request(app)
        .get(`/api/campaigns/${campaign.id}/leads`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(3);
    });
  });

  describe('DELETE /api/campaigns/:id', () => {
    it('should delete a campaign and cascade associations', async () => {
      const campaign = await createTestCampaign({ organizationId: org.id, createdById: user.id });
      const lead = await createTestLead({ organizationId: org.id });
      await createTestCampaignLead(campaign.id, lead.id);

      const res = await request(app)
        .delete(`/api/campaigns/${campaign.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/campaigns/${campaign.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(check.status).toBe(404);
    });
  });
});
