import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';

describe('Production Readiness Smoke Test Flow (Full CRM Lifecycle)', () => {
  beforeAll(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  let authCookie: string;
  let authToken: string;
  let organizationId: string;
  let userId: string;

  let leadId: string;
  let customerId: string;
  let contactId: string;
  let opportunityId: string;
  let pipelineId: string;
  let stages: { id: string; name: string }[] = [];
  let productId: string;
  let quoteId: string;
  let orderId: string;
  let taskId: string;
  let activityId: string;
  let supportCaseId: string;
  let campaignId: string;

  it('1. Public Landing & Health Endpoint Verification', async () => {
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.success).toBe(true);
    expect(healthRes.body.data.status).toBe('healthy');
    expect(healthRes.body.data.database).toBe('connected');
  });

  it('2. Signup & Organization Creation (Super Admin bootstrap)', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Acme Enterprise Solutions',
        name: 'Jane Doe',
        email: 'admin@vynexa.com',
        password: 'ProductionReadyPassword123!',
        confirmPassword: 'ProductionReadyPassword123!'
      });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.data.user).toBeDefined();

    const cookies = signupRes.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('vynexa_token=');

    organizationId = signupRes.body.data.user.organizationId;
    userId = signupRes.body.data.user.id;
  });

  it('3. Login & Session Authentication', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@vynexa.com',
        password: 'ProductionReadyPassword123!'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    authCookie = cookies[0].split(';')[0];
    authToken = loginRes.body.data.token;
  });

  it('4. Dashboard Overview Access', async () => {
    const dashRes = await request(app)
      .get('/api/dashboard/overview')
      .set('Cookie', authCookie);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    expect(dashRes.body.data.organization.id).toBe(organizationId);
    expect(dashRes.body.data.metrics).toBeDefined();
  });

  it('5. Create Lead', async () => {
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Cookie', authCookie)
      .send({
        firstName: 'Alexander',
        lastName: 'Hamilton',
        email: 'alex.hamilton@treasury.gov',
        company: 'Department of Treasury',
        jobTitle: 'Secretary',
        source: 'DIRECT_OUTREACH',
        score: 85
      });

    expect(leadRes.status).toBe(201);
    expect(leadRes.body.success).toBe(true);
    expect(leadRes.body.data.id).toBeDefined();
    leadId = leadRes.body.data.id;
  });

  it('6. Convert Lead into Customer (Account), Contact & Opportunity', async () => {
    // First get default pipeline stages
    const pipeRes = await request(app)
      .get('/api/pipelines')
      .set('Cookie', authCookie);
    expect(pipeRes.status).toBe(200);
    expect(pipeRes.body.data.length).toBeGreaterThan(0);
    pipelineId = pipeRes.body.data[0].id;
    stages = pipeRes.body.data[0].stages;
    expect(stages.length).toBeGreaterThan(1);

    const convertRes = await request(app)
      .post(`/api/leads/${leadId}/convert`)
      .set('Cookie', authCookie)
      .send({
        account: {
          name: 'Department of Treasury Inc',
          industry: 'Government & Finance',
          email: 'inquiries@treasury.gov'
        },
        contact: {
          firstName: 'Alexander',
          lastName: 'Hamilton',
          email: 'alex.hamilton@treasury.gov',
          jobTitle: 'Treasury Secretary'
        },
        createOpportunity: true,
        opportunity: {
          name: 'National Financial Systems Upgrade',
          value: 250000,
          pipelineId,
          stageId: stages[0].id
        }
      });

    expect(convertRes.status).toBe(200);
    expect(convertRes.body.success).toBe(true);
    expect(convertRes.body.data.accountId).toBeDefined();
    expect(convertRes.body.data.contactId).toBeDefined();
    expect(convertRes.body.data.opportunityId).toBeDefined();

    customerId = convertRes.body.data.accountId;
    contactId = convertRes.body.data.contactId;
    opportunityId = convertRes.body.data.opportunityId;
  });

  it('7. Move Opportunity Through Pipeline Stages', async () => {
    const moveRes = await request(app)
      .patch(`/api/opportunities/${opportunityId}/stage`)
      .set('Cookie', authCookie)
      .send({
        stageId: stages[1].id
      });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.success).toBe(true);
    expect(moveRes.body.data.stageId).toBe(stages[1].id);
  });

  it('8. Create Product in Commercial Catalog', async () => {
    const prodRes = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Enterprise CRM Core License',
        sku: 'CRM-ENT-2026',
        description: 'Annual multi-tenant commercial seat license',
        type: 'PRODUCT',
        price: 15000,
        currency: 'USD',
        isActive: true
      });

    expect(prodRes.status).toBe(201);
    expect(prodRes.body.success).toBe(true);
    expect(prodRes.body.data.id).toBeDefined();
    productId = prodRes.body.data.id;
  });

  it('9. Create Formal Price Quote Proposal with Line Items', async () => {
    const quoteRes = await request(app)
      .post('/api/quotes')
      .set('Cookie', authCookie)
      .send({
        accountId: customerId,
        opportunityId,
        notes: 'Commercial license proposal valid for 30 calendar days',
        items: [
          {
            productId,
            description: 'Enterprise CRM Core License - 10 Seats',
            quantity: 10,
            unitPrice: 15000,
            discount: 10000,
            tax: 5000
          }
        ]
      });

    expect(quoteRes.status).toBe(201);
    expect(quoteRes.body.success).toBe(true);
    expect(quoteRes.body.data.quoteNumber).toBeDefined();
    expect(quoteRes.body.data.status).toBe('DRAFT');
    quoteId = quoteRes.body.data.id;
  });

  it('10. Approve Quote Proposal', async () => {
    const approveRes = await request(app)
      .post(`/api/quotes/${quoteId}/approve`)
      .set('Cookie', authCookie)
      .send({});

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.status).toBe('APPROVED');
  });

  it('11. Convert Approved Quote into Commercial Order', async () => {
    const orderRes = await request(app)
      .post(`/api/quotes/${quoteId}/convert-to-order`)
      .set('Cookie', authCookie)
      .send({});

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderNumber).toBeDefined();
    expect(orderRes.body.data.quoteId).toBe(quoteId);
    orderId = orderRes.body.data.id;
  });

  it('12. Create Task', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Cookie', authCookie)
      .send({
        title: 'Schedule executive onboarding conference call',
        priority: 'HIGH',
        status: 'TODO',
        accountId: customerId,
        contactId,
        opportunityId
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.success).toBe(true);
    taskId = taskRes.body.data.id;
  });

  it('13. Create Activity Interaction Record', async () => {
    const actRes = await request(app)
      .post('/api/activities')
      .set('Cookie', authCookie)
      .send({
        type: 'MEETING',
        subject: 'Kickoff and architecture consultation',
        description: 'Completed preliminary requirements alignment with treasury team',
        duration: 45,
        accountId: customerId,
        contactId,
        opportunityId
      });

    expect(actRes.status).toBe(201);
    expect(actRes.body.success).toBe(true);
    activityId = actRes.body.data.id;
  });

  it('14. Create Support Case', async () => {
    const caseRes = await request(app)
      .post('/api/support-cases')
      .set('Cookie', authCookie)
      .send({
        subject: 'SSO SAML integration setup assistance',
        description: 'Need assistance configuring Okta identity provider with Vynexa CRM',
        priority: 'HIGH',
        status: 'OPEN',
        accountId: customerId,
        contactId
      });

    expect(caseRes.status).toBe(201);
    expect(caseRes.body.success).toBe(true);
    supportCaseId = caseRes.body.data.id;
  });

  it('15. Create Marketing Campaign', async () => {
    const campRes = await request(app)
      .post('/api/campaigns')
      .set('Cookie', authCookie)
      .send({
        name: 'Q3 Enterprise Digital Expansion Campaign',
        type: 'WEBINAR',
        status: 'ACTIVE',
        budget: 50000
      });

    expect(campRes.status).toBe(201);
    expect(campRes.body.success).toBe(true);
    campaignId = campRes.body.data.id;
  });

  it('16. View Analytical Reports (PostgreSQL Aggregation)', async () => {
    const repRes = await request(app)
      .get('/api/reports/overview')
      .set('Cookie', authCookie);

    expect(repRes.status).toBe(200);
    expect(repRes.body.success).toBe(true);
    expect(repRes.body.data.leads).toBeDefined();
    expect(repRes.body.data.sales).toBeDefined();
    expect(repRes.body.data.tasks).toBeDefined();
  });

  it('17. View Immutable Audit Logs', async () => {
    const auditRes = await request(app)
      .get('/api/audit-logs')
      .set('Cookie', authCookie);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(Array.isArray(auditRes.body.data)).toBe(true);
    expect(auditRes.body.data.length).toBeGreaterThan(0);

    // Verify sensitive data was redacted
    for (const log of auditRes.body.data) {
      if (log.newValue) {
        expect(JSON.stringify(log.newValue)).not.toContain('passwordHash');
      }
    }
  });

  it('18. Global Search Across Permitted Entities', async () => {
    const searchRes = await request(app)
      .get('/api/search?q=Treasury')
      .set('Cookie', authCookie);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.results.length).toBeGreaterThan(0);
    expect(searchRes.body.data.grouped).toBeDefined();
  });

  it('19. Logout & Session Termination', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('20. Relational Database Data Integrity Verification', async () => {
    // 1. Verify Lead conversion relationships
    const lead = await prismaTest.lead.findUnique({
      where: { id: leadId },
      include: { convertedAccount: true, convertedContact: true }
    });
    expect(lead).toBeDefined();
    expect(lead?.status).toBe('CONVERTED');
    expect(lead?.convertedAccountId).toBe(customerId);
    expect(lead?.convertedContactId).toBe(contactId);

    // 2. Verify Customer -> Contact relationship
    const customer = await prismaTest.account.findUnique({
      where: { id: customerId },
      include: { contacts: true, opportunities: true, quotes: true, orders: true }
    });
    expect(customer?.contacts.some((c) => c.id === contactId)).toBe(true);
    expect(customer?.opportunities.some((o) => o.id === opportunityId)).toBe(true);
    expect(customer?.quotes.some((q) => q.id === quoteId)).toBe(true);
    expect(customer?.orders.some((o) => o.id === orderId)).toBe(true);

    // 3. Verify Quote Items and Order Items
    const quoteItems = await prismaTest.quoteItem.findMany({ where: { quoteId } });
    expect(quoteItems.length).toBe(1);
    expect(quoteItems[0].productId).toBe(productId);

    const orderItems = await prismaTest.orderItem.findMany({ where: { orderId } });
    expect(orderItems.length).toBe(1);
    expect(orderItems[0].productId).toBe(productId);

    // 4. Verify Quote -> Order relationship
    const order = await prismaTest.order.findUnique({ where: { id: orderId } });
    expect(order?.quoteId).toBe(quoteId);

    // 5. Verify multi-tenant boundary integrity
    expect(customer?.organizationId).toBe(organizationId);
    expect(order?.organizationId).toBe(organizationId);
  });
});
