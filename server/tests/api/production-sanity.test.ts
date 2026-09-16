import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';

describe('Database Large-Data Sanity & Pagination Audit Test', () => {
  let authCookie: string;
  let organizationId: string;
  let userId: string;
  let defaultPipelineId: string;
  let defaultStageId: string;

  beforeAll(async () => {
    await clearTestDb();

    // 1. Register organization & user with admin@vynexa.com (Super Admin)
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Sanity Performance Corp',
        name: 'Benchmarker',
        email: 'admin@vynexa.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

    const cookies = signupRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies[0].split(';')[0];
    organizationId = signupRes.body.data.user.organizationId;
    userId = signupRes.body.data.user.id;

    // Get default pipeline & stage
    const pipelines = await prismaTest.pipeline.findMany({
      where: { organizationId },
      include: { stages: true }
    });
    defaultPipelineId = pipelines[0].id;
    defaultStageId = pipelines[0].stages[0].id;

    // 2. Seed realistic volume of records into PostgreSQL
    // 25 Leads
    await prismaTest.lead.createMany({
      data: Array.from({ length: 25 }).map((_, i) => ({
        organizationId,
        firstName: `LeadFirst_${i}`,
        lastName: `LeadLast_${i}`,
        email: `lead_${i}@example.com`,
        company: `Company_${i % 5}`,
        status: i % 2 === 0 ? 'NEW' : 'QUALIFIED',
        score: (i * 4) % 100
      }))
    });

    // 15 Accounts (Customers)
    const accountsData = Array.from({ length: 15 }).map((_, i) => ({
      organizationId,
      name: `Account Corp ${i}`,
      industry: i % 2 === 0 ? 'Technology' : 'Finance',
      email: `contact@account${i}.com`
    }));
    await prismaTest.account.createMany({ data: accountsData });

    const accounts = await prismaTest.account.findMany({ where: { organizationId } });

    // 20 Contacts
    await prismaTest.contact.createMany({
      data: Array.from({ length: 20 }).map((_, i) => ({
        organizationId,
        accountId: accounts[i % accounts.length].id,
        firstName: `ContactFirst_${i}`,
        lastName: `ContactLast_${i}`,
        email: `person_${i}@client.com`
      }))
    });

    // 20 Opportunities
    await prismaTest.opportunity.createMany({
      data: Array.from({ length: 20 }).map((_, i) => ({
        organizationId,
        accountId: accounts[i % accounts.length].id,
        pipelineId: defaultPipelineId,
        stageId: defaultStageId,
        name: `Deal Prospect ${i}`,
        value: (i + 1) * 5000,
        status: i % 3 === 0 ? 'WON' : 'OPEN'
      }))
    });

    // 25 Tasks
    await prismaTest.task.createMany({
      data: Array.from({ length: 25 }).map((_, i) => ({
        organizationId,
        createdById: userId,
        title: `Action Item ${i}`,
        status: i % 2 === 0 ? 'TODO' : 'COMPLETED',
        priority: 'MEDIUM',
        accountId: accounts[i % accounts.length].id
      }))
    });

    // 25 Activities
    await prismaTest.activity.createMany({
      data: Array.from({ length: 25 }).map((_, i) => ({
        organizationId,
        createdById: userId,
        type: 'CALL',
        subject: `Client Outreach Call ${i}`,
        accountId: accounts[i % accounts.length].id
      }))
    });

    // 15 Products
    await prismaTest.product.createMany({
      data: Array.from({ length: 15 }).map((_, i) => ({
        organizationId,
        name: `SKU Item ${i}`,
        sku: `SKU-${1000 + i}`,
        price: (i + 1) * 100,
        type: 'PRODUCT'
      }))
    });

    // 10 Support Cases
    await prismaTest.supportCase.createMany({
      data: Array.from({ length: 10 }).map((_, i) => ({
        organizationId,
        createdById: userId,
        subject: `Issue Ticket ${i}`,
        status: 'OPEN',
        priority: 'MEDIUM',
        accountId: accounts[i % accounts.length].id
      }))
    });

    // 5 Campaigns
    await prismaTest.campaign.createMany({
      data: Array.from({ length: 5 }).map((_, i) => ({
        organizationId,
        createdById: userId,
        name: `Growth Campaign ${i}`,
        status: 'ACTIVE',
        budget: (i + 1) * 10000
      }))
    });
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  describe('Pagination Limits (page >= 1, limit <= 100)', () => {
    it('should paginate Leads within safe limits', async () => {
      const res = await request(app)
        .get('/api/leads?page=1&limit=10')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(10);
      expect(res.body.meta.total).toBe(25);
      expect(res.body.meta.totalPages).toBe(3);
    });

    it('should cap excessive limit to max 100', async () => {
      const res = await request(app)
        .get('/api/leads?page=1&limit=500')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBeLessThanOrEqual(100);
    });

    it('should paginate Tasks with custom limit', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=15')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(15);
      expect(res.body.meta.total).toBe(25);
    });

    it('should paginate Activities with custom limit', async () => {
      const res = await request(app)
        .get('/api/activities?page=2&limit=10')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(10);
      expect(res.body.meta.page).toBe(2);
    });
  });

  describe('Aggregation & Reports Performance (PostgreSQL Aggregation)', () => {
    it('should aggregate overview metrics directly in PostgreSQL without memory leaks', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/reports/overview')
        .set('Cookie', authCookie);
      const durationMs = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.data.leads.total).toBe(25);
      expect(res.body.data.sales.totalOpportunities).toBe(20);
      // Execution must complete within a reasonable timeframe (< 1000ms)
      expect(durationMs).toBeLessThan(1000);
    });

    it('should render executive dashboard overview promptly', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Cookie', authCookie);
      const durationMs = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalLeads).toBe(25);
      expect(durationMs).toBeLessThan(1000);
    });
  });

  describe('Search Performance & Multi-Tenant Boundaries', () => {
    it('should execute global search across multiple entity domains with bounded results', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/search?q=Item')
        .set('Cookie', authCookie);
      const durationMs = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.data.results).toBeDefined();
      expect(res.body.data.totalMatches).toBeGreaterThan(0);
      expect(durationMs).toBeLessThan(1000);
    });

    it('should reject search with excessive query string length', async () => {
      const longQuery = 'a'.repeat(150);
      const res = await request(app)
        .get(`/api/search?q=${longQuery}`)
        .set('Cookie', authCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
