import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Dashboard API Routes (/api/dashboard) (API integration)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('GET /api/dashboard/overview', () => {
    it('should return 401 UNAUTHORIZED when no authentication cookie or token is provided', async () => {
      const response = await request(app).get('/api/dashboard/overview');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 OK with complete dashboard payload for authenticated user', async () => {
      // 1. Create Org A, Role, User
      const org = await createTestOrg({ name: 'Apex Corp', currency: 'USD' });
      const role = await createTestRole({ organizationId: org.id, name: 'SALES_MANAGER' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id, email: 'apex.admin@apex.com' });

      // 2. Generate Auth Token
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: role.id,
        roleName: role.name,
        email: user.email
      });

      // 3. Create Sample Lead, Opportunity, Account, Contact, Activities & Tasks for Org A
      const lead = await prismaTest.lead.create({
        data: {
          organizationId: org.id,
          firstName: 'Sarah',
          lastName: 'Jenkins',
          company: 'Apex Prospect'
        }
      });

      const account = await prismaTest.account.create({
        data: {
          organizationId: org.id,
          name: 'Apex Enterprise'
        }
      });

      const contact = await prismaTest.contact.create({
        data: {
          organizationId: org.id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@apex.com'
        }
      });

      const pipeline = await prismaTest.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Sales Pipeline'
        }
      });

      const stage = await prismaTest.pipelineStage.create({
        data: {
          pipelineId: pipeline.id,
          name: 'Discovery',
          order: 1,
          probability: 0.2
        }
      });

      const opportunity = await prismaTest.opportunity.create({
        data: {
          organizationId: org.id,
          pipelineId: pipeline.id,
          stageId: stage.id,
          name: 'Big Acme Deal',
          value: 50000
        }
      });

      const leadNoCompany = await prismaTest.lead.create({
        data: {
          organizationId: org.id,
          firstName: 'NoCompany',
          lastName: 'Lead',
          company: null
        }
      });

      await prismaTest.activity.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          type: 'NOTE',
          subject: 'Note for no company lead',
          activityDate: new Date(),
          leadId: leadNoCompany.id
        }
      });

      // Create 4 activities (lead, account, contact, opportunity)
      await prismaTest.activity.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          type: 'CALL',
          subject: 'Call Lead',
          activityDate: new Date(),
          leadId: lead.id
        }
      });

      await prismaTest.activity.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          type: 'MEETING',
          subject: 'Account Meeting',
          activityDate: new Date(),
          accountId: account.id
        }
      });

      await prismaTest.activity.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          type: 'EMAIL',
          subject: 'Email Contact',
          activityDate: new Date(),
          contactId: contact.id
        }
      });

      await prismaTest.activity.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          type: 'NOTE',
          subject: 'Note Deal',
          activityDate: new Date(),
          opportunityId: opportunity.id
        }
      });

      // Create 3 tasks (account, lead, opportunity) with past and future due dates
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prismaTest.task.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          assignedToId: user.id,
          title: 'Account Task',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: yesterday,
          accountId: account.id
        }
      });

      await prismaTest.task.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          title: 'Lead Task',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          leadId: lead.id
        }
      });

      await prismaTest.task.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          title: 'Opportunity Task',
          status: 'TODO',
          priority: 'LOW',
          opportunityId: opportunity.id
        }
      });

      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.name).toBe('Apex Corp');
      expect(response.body.data.organization.currency).toBe('USD');
      expect(response.body.data.metrics.totalLeads).toBe(2);
      expect(response.body.data.recentActivities.length).toBe(5);
      expect(response.body.data.metrics).toHaveProperty('activeOpportunities');
      expect(response.body.data.metrics).toHaveProperty('pipelineValue');
      expect(response.body.data.metrics).toHaveProperty('openTasks');
      expect(response.body.data).toHaveProperty('pipeline');
      expect(response.body.data).toHaveProperty('recentActivities');
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('notifications');
    });

    it('should enforce strict multi-tenancy isolation between Organization A and Organization B', async () => {
      // Create Organization A & user
      const orgA = await createTestOrg({ name: 'Alpha Logistics' });
      const roleA = await createTestRole({ organizationId: orgA.id, name: 'SALES_MANAGER' });
      const userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'user.a@alpha.com' });

      // Create Organization B & user
      const orgB = await createTestOrg({ name: 'Beta Tech' });
      const roleB = await createTestRole({ organizationId: orgB.id, name: 'SALES_MANAGER' });

      // Seed 3 Leads for Org A
      for (let i = 0; i < 3; i++) {
        await prismaTest.lead.create({
          data: { organizationId: orgA.id, firstName: `LeadA-${i}`, lastName: 'Test' }
        });
      }

      // Seed 10 Leads for Org B
      for (let i = 0; i < 10; i++) {
        await prismaTest.lead.create({
          data: { organizationId: orgB.id, firstName: `LeadB-${i}`, lastName: 'Test' }
        });
      }

      // Authenticate as Org A
      const tokenA = authService.generateToken({
        userId: userA.id,
        organizationId: orgA.id,
        roleId: roleA.id,
        roleName: roleA.name,
        email: userA.email
      });

      const resA = await request(app)
        .get('/api/dashboard/overview')
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(resA.status).toBe(200);
      expect(resA.body.data.organization.name).toBe('Alpha Logistics');
      expect(resA.body.data.metrics.totalLeads).toBe(3); // ONLY Org A count
    });

    it('should ignore tenant parameter tampering attempts in query strings', async () => {
      const orgA = await createTestOrg({ name: 'Org A Security' });
      const roleA = await createTestRole({ organizationId: orgA.id, name: 'SALES_MANAGER' });
      const userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id });

      const orgB = await createTestOrg({ name: 'Org B Security' });

      await prismaTest.lead.create({
        data: { organizationId: orgA.id, firstName: 'ValidA', lastName: 'Lead' }
      });

      await prismaTest.lead.create({
        data: { organizationId: orgB.id, firstName: 'TamperB', lastName: 'Lead' }
      });

      const tokenA = authService.generateToken({
        userId: userA.id,
        organizationId: orgA.id,
        roleId: roleA.id,
        roleName: roleA.name,
        email: userA.email
      });

      // Try passing ?organizationId=OrgB
      const resTamper = await request(app)
        .get(`/api/dashboard/overview?organizationId=${orgB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(resTamper.status).toBe(200);
      expect(resTamper.body.data.organization.id).toBe(orgA.id); // Must remain Org A!
      expect(resTamper.body.data.metrics.totalLeads).toBe(1);
    });
  });
});
