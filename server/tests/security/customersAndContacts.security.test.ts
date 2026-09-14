import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Customers & Contacts Security (Multi-Tenancy & Cross-Tenant Defense)', () => {
  let orgA: any;
  let orgB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await clearTestDb();

    // Org A setup
    orgA = await createTestOrg({ name: 'Organization A' });
    const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'userA@orga.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });

    // Org B setup
    orgB = await createTestOrg({ name: 'Organization B' });
    const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'userB@orgb.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
  });

  describe('IDOR & Data Isolation across Tenants', () => {
    it('User A should NOT be able to view User B account details (404 NOT_FOUND)', async () => {
      const accountB = await createTestAccount({ organizationId: orgB.id, name: 'Confidential Corp B' });

      const res = await request(app)
        .get(`/api/customers/${accountB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('User A should NOT see User B accounts in customer list API', async () => {
      await createTestAccount({ organizationId: orgA.id, name: 'Org A Account' });
      await createTestAccount({ organizationId: orgB.id, name: 'Org B Account' });

      const res = await request(app)
        .get('/api/customers')
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Org A Account');
    });

    it('User A should NOT be able to soft-delete User B account (404 NOT_FOUND)', async () => {
      const accountB = await createTestAccount({ organizationId: orgB.id, name: 'Target Account B' });

      const res = await request(app)
        .delete(`/api/customers/${accountB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('User A should NOT be able to view User B contact details (404 NOT_FOUND)', async () => {
      const contactB = await createTestContact({ organizationId: orgB.id, firstName: 'Secret', lastName: 'Agent' });

      const res = await request(app)
        .get(`/api/contacts/${contactB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('Cross-Tenant Account Attack Prevention', () => {
    it('User A should be REJECTED with 400 when attempting to link a contact to an account in Org B', async () => {
      const accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Target Account' });

      const payload = {
        firstName: 'Malicious',
        lastName: 'Actor',
        email: 'attacker@orga.com',
        accountId: accountB.id // Cross-tenant account attack!
      };

      const res = await request(app)
        .post('/api/contacts')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ACCOUNT');
    });

    it('User A should be REJECTED when updating an existing contact to point to an account in Org B', async () => {
      const contactA = await createTestContact({ organizationId: orgA.id, firstName: 'Legit', lastName: 'User' });
      const accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Target Account' });

      const res = await request(app)
        .patch(`/api/contacts/${contactA.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ accountId: accountB.id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ACCOUNT');
    });
  });
});
