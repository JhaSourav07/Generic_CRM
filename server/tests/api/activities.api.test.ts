import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestActivity } from '../factories/activity.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Activities API Routes (/api/activities) (API integration)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;

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
  });

  describe('GET /api/activities', () => {
    it('should return 401 UNAUTHORIZED when no auth token provided', async () => {
      const res = await request(app).get('/api/activities');
      expect(res.status).toBe(401);
    });

    it('should list activities with pagination metadata', async () => {
      await createTestActivity({ organizationId: org.id, createdById: user.id, subject: 'Call 1' });
      await createTestActivity({ organizationId: org.id, createdById: user.id, subject: 'Meeting 2' });

      const res = await request(app)
        .get('/api/activities')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter activities by type', async () => {
      await createTestActivity({ organizationId: org.id, createdById: user.id, type: 'CALL', subject: 'Phone Call' });
      await createTestActivity({ organizationId: org.id, createdById: user.id, type: 'EMAIL', subject: 'Inbound Email' });

      const res = await request(app)
        .get('/api/activities?type=CALL')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('CALL');
    });
  });

  describe('POST /api/activities', () => {
    it('should create an activity with valid account and contact', async () => {
      const account = await createTestAccount({ organizationId: org.id });
      const contact = await createTestContact({ organizationId: org.id, accountId: account.id });

      const payload = {
        type: 'MEETING',
        subject: 'Demo Presentation',
        description: 'Demonstrated product features and discussed integration roadmap.',
        activityDate: new Date().toISOString(),
        accountId: account.id,
        contactId: contact.id
      };

      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe('Demo Presentation');
      expect(res.body.data.type).toBe('MEETING');
      expect(res.body.data.accountId).toBe(account.id);
      expect(res.body.data.contactId).toBe(contact.id);
      expect(res.body.data.createdById).toBe(user.id);
    });

    it('should reject activity when contact does not belong to specified account', async () => {
      const accountA = await createTestAccount({ organizationId: org.id, name: 'Account A' });
      const accountB = await createTestAccount({ organizationId: org.id, name: 'Account B' });
      const contactB = await createTestContact({ organizationId: org.id, accountId: accountB.id });

      const payload = {
        type: 'CALL',
        subject: 'Inconsistent Call',
        accountId: accountA.id,
        contactId: contactB.id
      };

      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('RELATIONAL_CONSISTENCY_ERROR');
    });

    it('should reject activity when opportunity does not belong to specified account', async () => {
      const accountA = await createTestAccount({ organizationId: org.id, name: 'Account A' });
      const accountB = await createTestAccount({ organizationId: org.id, name: 'Account B' });
      const pipeline = await createTestPipeline({ organizationId: org.id });
      const oppB = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        accountId: accountB.id,
        name: 'Deal B'
      });

      const payload = {
        type: 'CALL',
        subject: 'Mismatched Opp Call',
        accountId: accountA.id,
        opportunityId: oppB.id
      };

      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('RELATIONAL_CONSISTENCY_ERROR');
    });
  });

  describe('GET /api/activities/:id', () => {
    it('should return activity details by ID', async () => {
      const activity = await createTestActivity({
        organizationId: org.id,
        createdById: user.id,
        subject: 'Introductory Discussion'
      });

      const res = await request(app)
        .get(`/api/activities/${activity.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe('Introductory Discussion');
    });

    it('should return 404 NOT_FOUND for non-existent activity ID', async () => {
      const res = await request(app)
        .get('/api/activities/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/activities/:id', () => {
    it('should update activity fields and record audit log', async () => {
      const activity = await createTestActivity({
        organizationId: org.id,
        createdById: user.id,
        subject: 'Initial Title'
      });

      const res = await request(app)
        .patch(`/api/activities/${activity.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ subject: 'Updated Call Summary' });

      expect(res.status).toBe(200);
      expect(res.body.data.subject).toBe('Updated Call Summary');
    });
  });

  describe('DELETE /api/activities/:id', () => {
    it('should delete activity record', async () => {
      const activity = await createTestActivity({
        organizationId: org.id,
        createdById: user.id,
        subject: 'Record to be removed'
      });

      const res = await request(app)
        .delete(`/api/activities/${activity.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/api/activities/${activity.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(checkRes.status).toBe(404);
    });
  });

  describe('GET /api/activities/timeline', () => {
    it('should return chronological timeline records for an entity', async () => {
      const account = await createTestAccount({ organizationId: org.id });
      await createTestActivity({
        organizationId: org.id,
        createdById: user.id,
        accountId: account.id,
        subject: 'Meeting 1',
        activityDate: new Date('2026-09-10T10:00:00Z')
      });
      await createTestActivity({
        organizationId: org.id,
        createdById: user.id,
        accountId: account.id,
        subject: 'Meeting 2',
        activityDate: new Date('2026-09-12T10:00:00Z')
      });

      const res = await request(app)
        .get(`/api/activities/timeline?accountId=${account.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].subject).toBe('Meeting 2'); // desc order
    });
  });
});
