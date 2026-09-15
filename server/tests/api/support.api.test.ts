import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { createTestSupportCase } from '../factories/supportCase.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';
import { SupportCaseStatus, SupportCasePriority } from '@prisma/client';

describe('Support Cases API Routes (/api/support-cases)', () => {
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

  describe('GET /api/support-cases', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/support-cases');
      expect(res.status).toBe(401);
    });

    it('should list support cases with pagination metadata', async () => {
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, subject: 'Issue 1' });
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, subject: 'Issue 2' });

      const res = await request(app)
        .get('/api/support-cases')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should search support cases by subject keyword', async () => {
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, subject: 'Billing error on invoice' });
      await createTestSupportCase({ organizationId: org.id, createdById: user.id, subject: 'Database timeout issue' });

      const res = await request(app)
        .get('/api/support-cases?search=billing')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].subject).toContain('Billing error');
    });
  });

  describe('POST /api/support-cases', () => {
    it('should create a support case with valid account and contact', async () => {
      const account = await createTestAccount({ organizationId: org.id });
      const contact = await createTestContact({ organizationId: org.id, accountId: account.id });

      const res = await request(app)
        .post('/api/support-cases')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          subject: 'Integration Webhook Failure',
          description: 'Webhooks failing with HTTP 500 error code',
          priority: 'HIGH',
          accountId: account.id,
          contactId: contact.id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe('Integration Webhook Failure');
      expect(res.body.data.priority).toBe(SupportCasePriority.HIGH);
      expect(res.body.data.status).toBe(SupportCaseStatus.OPEN);
      expect(res.body.data.caseNumber).toMatch(/^CASE-[0-9A-F]{8}$/);
    });

    it('should reject support case creation when contact does not belong to specified account', async () => {
      const accountA = await createTestAccount({ organizationId: org.id, name: 'Company Alpha' });
      const accountB = await createTestAccount({ organizationId: org.id, name: 'Company Beta' });
      const contactB = await createTestContact({ organizationId: org.id, accountId: accountB.id });

      const res = await request(app)
        .post('/api/support-cases')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          subject: 'Mismatched Contact Case',
          accountId: accountA.id,
          contactId: contactB.id
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INCONSISTENT_RELATION');
    });
  });

  describe('Support Case Lifecycle Actions', () => {
    it('should transition case status from OPEN to IN_PROGRESS', async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: user.id,
        status: SupportCaseStatus.OPEN
      });

      const res = await request(app)
        .patch(`/api/support-cases/${supportCase.id}/status`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(SupportCaseStatus.IN_PROGRESS);
    });

    it('should assign support case to an active team member', async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: user.id
      });
      const agent = await createTestUser({ organizationId: org.id, roleId: role.id, email: 'agent@crm.com' });

      const res = await request(app)
        .patch(`/api/support-cases/${supportCase.id}/assign`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ assignedToId: agent.id });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedToId).toBe(agent.id);
    });

    it('should resolve a case with required resolution text and timestamp', async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: user.id,
        status: SupportCaseStatus.IN_PROGRESS
      });

      const res = await request(app)
        .post(`/api/support-cases/${supportCase.id}/resolve`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ resolution: 'Patched webhook parser to handle missing headers.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(SupportCaseStatus.RESOLVED);
      expect(res.body.data.resolution).toContain('Patched webhook');
      expect(res.body.data.resolvedAt).not.toBeNull();
    });

    it('should close a resolved case', async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: user.id,
        status: SupportCaseStatus.RESOLVED
      });

      const res = await request(app)
        .post(`/api/support-cases/${supportCase.id}/close`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ notes: 'Verified resolution with customer' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(SupportCaseStatus.CLOSED);
    });

    it('should reopen a closed case to OPEN state and clear resolvedAt', async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: user.id,
        status: SupportCaseStatus.CLOSED,
        resolvedAt: new Date()
      });

      const res = await request(app)
        .post(`/api/support-cases/${supportCase.id}/reopen`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(SupportCaseStatus.OPEN);
      expect(res.body.data.resolvedAt).toBeNull();
    });
  });

  describe('DELETE /api/support-cases/:id', () => {
    it('should soft delete support case', async () => {
      const supportCase = await createTestSupportCase({
        organizationId: org.id,
        createdById: user.id
      });

      const res = await request(app)
        .delete(`/api/support-cases/${supportCase.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbCase = await prismaTest.supportCase.findUnique({
        where: { id: supportCase.id }
      });
      expect(dbCase?.deletedAt).not.toBeNull();
    });
  });
});
