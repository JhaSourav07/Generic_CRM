import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestActivity } from '../factories/activity.factory.js';
import { createTestTask } from '../factories/task.factory.js';
import { createTestSupportCase } from '../factories/supportCase.factory.js';
import { createTestCampaign } from '../factories/campaign.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Reports & Analytics API Routes (/api/reports)', () => {
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

  describe('GET /api/reports/overview', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/reports/overview');
      expect(res.status).toBe(401);
    });

    it('should calculate accurate overview KPIs across leads, sales, tasks, support and campaigns', async () => {
      // Seed real data
      await createTestLead({ organizationId: org.id, status: 'QUALIFIED' });
      await createTestLead({ organizationId: org.id, status: 'CONVERTED' });

      const pipeline = await createTestPipeline({ organizationId: org.id });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 12000,
        status: 'OPEN'
      });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[3].id,
        value: 20000,
        status: 'WON'
      });

      await createTestTask({ organizationId: org.id, createdById: user.id, status: 'COMPLETED' });
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, status: 'RESOLVED' });
      await createTestCampaign({ organizationId: org.id, createdById: user.id, status: 'ACTIVE' });

      const res = await request(app)
        .get('/api/reports/overview')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leads.total).toBe(2);
      expect(res.body.data.leads.conversionRate).toBe(50);
      expect(res.body.data.sales.pipelineValue).toBe(12000);
      expect(res.body.data.sales.wonRevenue).toBe(20000);
      expect(res.body.data.tasks.completed).toBe(1);
      expect(res.body.data.support.resolved).toBe(1);
      expect(res.body.data.campaigns.active).toBe(1);
    });

    it('should handle zero records gracefully without NaN or Infinity', async () => {
      const res = await request(app)
        .get('/api/reports/overview')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.leads.conversionRate).toBe(0);
      expect(res.body.data.sales.winRate).toBe(0);
      expect(res.body.data.tasks.completionRate).toBe(0);
      expect(res.body.data.support.resolutionRate).toBe(0);
    });
  });

  describe('GET /api/reports/leads', () => {
    it('should return lead funnel stages and source breakdown', async () => {
      await createTestLead({ organizationId: org.id, status: 'NEW', source: 'WEBSITE' });
      await createTestLead({ organizationId: org.id, status: 'QUALIFIED', source: 'REFERRAL' });
      await createTestLead({ organizationId: org.id, status: 'CONVERTED', source: 'WEBSITE' });

      const res = await request(app)
        .get('/api/reports/leads')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.totalLeads).toBe(3);
      expect(res.body.data.statusBreakdown.NEW).toBe(1);
      expect(res.body.data.statusBreakdown.QUALIFIED).toBe(1);
      expect(res.body.data.statusBreakdown.CONVERTED).toBe(1);
      expect(res.body.data.funnel.length).toBe(4);
      expect(res.body.data.sources.find((s: any) => s.source === 'WEBSITE')?.count).toBe(2);
    });
  });

  describe('GET /api/reports/sales', () => {
    it('should compute sales metrics, win rate, and deal size', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[3].id,
        value: 15000,
        status: 'WON'
      });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[4].id,
        value: 5000,
        status: 'LOST'
      });

      const res = await request(app)
        .get('/api/reports/sales')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.wonOpportunities).toBe(1);
      expect(res.body.data.lostOpportunities).toBe(1);
      expect(res.body.data.winRate).toBe(50);
      expect(res.body.data.wonRevenue).toBe(15000);
      expect(res.body.data.averageDealSize).toBe(15000);
    });
  });

  describe('GET /api/reports/pipeline', () => {
    it('should aggregate opportunities by stage and calculate weighted values', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });
      // Qualification has 0.2 probability
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 10000,
        probability: 20
      });

      const res = await request(app)
        .get('/api/reports/pipeline')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.totalDeals).toBe(1);
      expect(res.body.data.totalPipelineValue).toBe(10000);
      expect(res.body.data.totalWeightedValue).toBe(2000);
    });
  });

  describe('GET /api/reports/activities, /tasks, /support, /campaigns', () => {
    it('should aggregate activities by type', async () => {
      await createTestActivity({ organizationId: org.id, createdById: user.id, type: 'CALL' });
      await createTestActivity({ organizationId: org.id, createdById: user.id, type: 'CALL' });
      await createTestActivity({ organizationId: org.id, createdById: user.id, type: 'EMAIL' });

      const res = await request(app)
        .get('/api/reports/activities')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.totalActivities).toBe(3);
      expect(res.body.data.byType.CALL).toBe(2);
      expect(res.body.data.byType.EMAIL).toBe(1);
    });

    it('should aggregate task status and completion rate', async () => {
      await createTestTask({ organizationId: org.id, createdById: user.id, status: 'COMPLETED' });
      await createTestTask({ organizationId: org.id, createdById: user.id, status: 'TODO' });

      const res = await request(app)
        .get('/api/reports/tasks')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.totalTasks).toBe(2);
      expect(res.body.data.completedTasks).toBe(1);
      expect(res.body.data.completionRate).toBe(50);
    });

    it('should aggregate support case resolution rate', async () => {
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, status: 'OPEN' });
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, status: 'RESOLVED' });

      const res = await request(app)
        .get('/api/reports/support')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCases).toBe(2);
      expect(res.body.data.resolvedCases).toBe(1);
      expect(res.body.data.resolutionRate).toBe(50);
    });

    it('should aggregate campaign budget and performance', async () => {
      await createTestCampaign({ organizationId: org.id, createdById: user.id, budget: 10000, status: 'ACTIVE' });

      const res = await request(app)
        .get('/api/reports/campaigns')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCampaigns).toBe(1);
      expect(res.body.data.totalBudget).toBe(10000);
    });
  });
});
