import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { createTestActivity } from '../factories/activity.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Activities Security, IDOR & Multi-Tenancy Attacks (security)', () => {
  let orgA: any;
  let userA: any;
  let tokenA: string;
  let accountA: any;
  let activityA: any;

  let orgB: any;
  let userB: any;
  let tokenB: string;
  let accountB: any;
  let contactB: any;
  let activityB: any;

  beforeEach(async () => {
    await clearTestDb();

    // Setup Org A
    orgA = await createTestOrg();
    const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'admin@orga.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });
    accountA = await createTestAccount({ organizationId: orgA.id, name: 'Org A Client' });
    activityA = await createTestActivity({
      organizationId: orgA.id,
      createdById: userA.id,
      accountId: accountA.id,
      subject: 'Org A Confidential Note'
    });

    // Setup Org B
    orgB = await createTestOrg();
    const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'admin@orgb.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
    accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Client' });
    contactB = await createTestContact({ organizationId: orgB.id, accountId: accountB.id });
    activityB = await createTestActivity({
      organizationId: orgB.id,
      createdById: userB.id,
      accountId: accountB.id,
      contactId: contactB.id,
      subject: 'Org B Secret Interaction'
    });
  });

  describe('IDOR Cross-Tenant Isolation', () => {
    it('should block Org A user from viewing Org B activity via GET', async () => {
      const res = await request(app)
        .get(`/api/activities/${activityB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from updating Org B activity via PATCH', async () => {
      const res = await request(app)
        .patch(`/api/activities/${activityB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ subject: 'Malicious Overwrite' });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from deleting Org B activity via DELETE', async () => {
      const res = await request(app)
        .delete(`/api/activities/${activityB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from linking Org A activity to Org B account', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          type: 'CALL',
          subject: 'Unauthorized Cross-Tenant Activity',
          accountId: accountB.id // belongs to Org B!
        });

      expect(res.status).toBe(404);
    });
  });

  describe('RBAC Authorization Boundaries', () => {
    it('should reject activity deletion when user role lacks activities:delete permission', async () => {
      const restrictedRole = await createTestRole({
        organizationId: orgA.id,
        name: 'RESTRICTED_USER',
        permissions: ['activities:read', 'activities:create']
      });
      const restrictedUser = await createTestUser({
        organizationId: orgA.id,
        roleId: restrictedRole.id,
        email: 'restricted@orga.com'
      });
      const restrictedToken = authService.generateToken({
        userId: restrictedUser.id,
        organizationId: orgA.id,
        roleId: restrictedRole.id,
        roleName: restrictedRole.name,
        email: restrictedUser.email
      });

      const res = await request(app)
        .delete(`/api/activities/${activityA.id}`)
        .set('Cookie', [`vynexa_token=${restrictedToken}`]);

      expect(res.status).toBe(403);
    });
  });
});
