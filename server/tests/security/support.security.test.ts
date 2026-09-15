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
import { clearTestDb } from '../helpers/testDb.js';

describe('Support Cases Security, IDOR & Multi-Tenancy Attacks (security)', () => {
  let orgA: any;
  let orgB: any;
  let roleA: any;
  let roleB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await clearTestDb();

    // Org A setup
    orgA = await createTestOrg({ name: 'Organization A', slug: 'org-a' });
    roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'admin@orga.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });

    // Org B setup
    orgB = await createTestOrg({ name: 'Organization B', slug: 'org-b' });
    roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'admin@orgb.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
  });

  describe('IDOR & Cross-Tenant Case Access', () => {
    it('should block Org A from reading Org B case via GET /api/support-cases/:id', async () => {
      const caseB = await createTestSupportCase({
        organizationId: orgB.id,
        createdById: userB.id,
        subject: 'Org B High Priority Incident'
      });

      const res = await request(app)
        .get(`/api/support-cases/${caseB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should block Org A from resolving Org B case via POST /api/support-cases/:id/resolve', async () => {
      const caseB = await createTestSupportCase({
        organizationId: orgB.id,
        createdById: userB.id,
        subject: 'Org B Case to Resolve'
      });

      const res = await request(app)
        .post(`/api/support-cases/${caseB.id}/resolve`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ resolution: 'Unauthorized resolution attempt' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should block Org A from closing Org B case via POST /api/support-cases/:id/close', async () => {
      const caseB = await createTestSupportCase({
        organizationId: orgB.id,
        createdById: userB.id,
        subject: 'Org B Case to Close'
      });

      const res = await request(app)
        .post(`/api/support-cases/${caseB.id}/close`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A from deleting Org B case via DELETE /api/support-cases/:id', async () => {
      const caseB = await createTestSupportCase({
        organizationId: orgB.id,
        createdById: userB.id
      });

      const res = await request(app)
        .delete(`/api/support-cases/${caseB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('Cross-Tenant Relational Linking Attacks', () => {
    it('should block Org A from creating case linked to Org B Customer Account', async () => {
      const accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Account' });

      const res = await request(app)
        .post('/api/support-cases')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          subject: 'Cross-Tenant Case Attempt',
          accountId: accountB.id
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should block Org A from creating case linked to Org B Contact', async () => {
      const contactB = await createTestContact({ organizationId: orgB.id, firstName: 'Bob', lastName: 'OrgB' });

      const res = await request(app)
        .post('/api/support-cases')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          subject: 'Cross-Tenant Contact Link',
          contactId: contactB.id
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Mass Assignment & Tenant Binding', () => {
    it('should ignore client-supplied organizationId and bind to authenticated tenant', async () => {
      const res = await request(app)
        .post('/api/support-cases')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          subject: 'Spoofed Org Case',
          organizationId: orgB.id
        });

      expect(res.status).toBe(201);
      expect(res.body.data.organizationId).toBe(orgA.id);
    });
  });
});
