import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestTask } from '../factories/task.factory.js';
import { createTestActivity } from '../factories/activity.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { createTestOrder } from '../factories/order.factory.js';
import { createTestSupportCase } from '../factories/supportCase.factory.js';
import { createTestCampaign } from '../factories/campaign.factory.js';
import { createTestProduct } from '../factories/product.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Global Search API Routes (/api/search)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Authentication & Validation', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/search?q=test');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with 400 VALIDATION_ERROR when query parameter q is missing', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      const res = await request(app)
        .get('/api/search')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with 400 VALIDATION_ERROR when query parameter q is empty or only whitespace', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      const res = await request(app)
        .get('/api/search?q=   ')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Multi-Entity Search Execution', () => {
    it('should find matching CRM records across multiple entity types and return standard envelope', async () => {
      const org = await createTestOrg({ name: 'Acme Enterprise Org' });
      const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({
        organizationId: org.id,
        roleId: role.id,
        name: 'Searcher Admin',
        email: 'searcher@acme.com'
      });
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      // Create test entities matching "Stark"
      await createTestLead({
        organizationId: org.id,
        firstName: 'Tony',
        lastName: 'Stark',
        company: 'Stark Industries',
        email: 'tony@stark.com'
      });

      const account = await createTestAccount({
        organizationId: org.id,
        name: 'Stark Industries',
        industry: 'Advanced Technology'
      });

      await createTestContact({
        organizationId: org.id,
        accountId: account.id,
        firstName: 'Pepper',
        lastName: 'Potts',
        email: 'pepper@stark.com'
      });

      const pipeline = await createTestPipeline({ organizationId: org.id });

      await createTestOpportunity({
        organizationId: org.id,
        accountId: account.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        name: 'Stark Arc Reactor Deployment'
      });

      await createTestTask({
        organizationId: org.id,
        createdById: user.id,
        title: 'Review Stark contract terms'
      });

      await createTestActivity({
        organizationId: org.id,
        createdById: user.id,
        subject: 'Quarterly review with Stark leadership'
      });

      await createTestProduct({
        organizationId: org.id,
        name: 'Stark Clean Energy Core',
        sku: 'STARK-001'
      });

      await createTestCampaign({
        organizationId: org.id,
        createdById: user.id,
        name: 'Stark Partner Showcase'
      });

      const res = await request(app)
        .get('/api/search?q=Stark')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.query).toBe('Stark');
      expect(res.body.data.totalMatches).toBeGreaterThanOrEqual(8);

      const { results, grouped } = res.body.data;
      expect(Array.isArray(results)).toBe(true);
      expect(grouped.leads.length).toBe(1);
      expect(grouped.leads[0].title).toContain('Tony Stark');
      expect(grouped.customers.length).toBe(1);
      expect(grouped.customers[0].title).toBe('Stark Industries');
      expect(grouped.contacts.length).toBe(1);
      expect(grouped.contacts[0].title).toBe('Pepper Potts');
      expect(grouped.opportunities.length).toBe(1);
      expect(grouped.opportunities[0].title).toContain('Stark Arc Reactor');
      expect(grouped.tasks.length).toBe(1);
      expect(grouped.tasks[0].title).toContain('Review Stark contract');
      expect(grouped.activities.length).toBe(1);
      expect(grouped.activities[0].title).toContain('Quarterly review with Stark');
      expect(grouped.products.length).toBe(1);
      expect(grouped.products[0].title).toContain('Stark Clean Energy');
      expect(grouped.campaigns.length).toBe(1);
      expect(grouped.campaigns[0].title).toContain('Stark Partner Showcase');
    });

    it('should find quotes and orders by document numbers', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      const quote = await createTestQuote({
        organizationId: org.id,
        createdById: user.id,
        quoteNumber: 'Q-GLOBAL-999'
      });

      const order = await createTestOrder({
        organizationId: org.id,
        createdById: user.id,
        orderNumber: 'ORD-GLOBAL-888'
      });

      const resQuote = await request(app)
        .get('/api/search?q=GLOBAL-999')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(resQuote.status).toBe(200);
      expect(resQuote.body.data.grouped.quotes.length).toBe(1);
      expect(resQuote.body.data.grouped.quotes[0].title).toContain('Q-GLOBAL-999');

      const resOrder = await request(app)
        .get('/api/search?q=GLOBAL-888')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(resOrder.status).toBe(200);
      expect(resOrder.body.data.grouped.orders.length).toBe(1);
      expect(resOrder.body.data.grouped.orders[0].title).toContain('ORD-GLOBAL-888');
    });

    it('should safely handle special characters and SQL injection attempts without errors', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      const maliciousInputs = [
        "' OR '1'='1",
        "'; DROP TABLE leads; --",
        "UNION SELECT * FROM users",
        "%20%27%22",
        "&& || ! < > () []",
        "Special@#%*()_+ Characters"
      ];

      for (const input of maliciousInputs) {
        const res = await request(app)
          .get(`/api/search?q=${encodeURIComponent(input)}`)
          .set('Cookie', [`vynexa_token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.results)).toBe(true);
      }
    });

    it('should respect the limit parameter per entity', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      // Create 5 leads matching "BatchLead"
      for (let i = 0; i < 5; i++) {
        await createTestLead({
          organizationId: org.id,
          firstName: `BatchLead_${i}`,
          lastName: 'Test',
          company: 'Batch Org'
        });
      }

      // Query with limit=2
      const res = await request(app)
        .get('/api/search?q=BatchLead&limit=2')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.grouped.leads.length).toBe(2);
    });
  });
});
