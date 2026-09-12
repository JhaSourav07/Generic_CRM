import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Organization API Routes (/api/organization)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('GET /api/organization/current', () => {
    it('should return active organization profile', async () => {
      const org = await createTestOrg({ name: 'Stark Industries', slug: 'stark-ind' });
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
        .get('/api/organization/current')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Stark Industries');
      expect(res.body.data.slug).toBe('stark-ind');
    });
  });

  describe('PATCH /api/organization/current', () => {
    it('should update organization details', async () => {
      const org = await createTestOrg({ name: 'Wayne Enterprises', slug: 'wayne-ent' });
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
        .patch('/api/organization/current')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'Wayne Global Corp',
          slug: 'wayne-global',
          currency: 'EUR',
          timezone: 'Europe/Paris'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Wayne Global Corp');
      expect(res.body.data.slug).toBe('wayne-global');
      expect(res.body.data.currency).toBe('EUR');
    });

    it('should prevent updating slug to an already taken slug by another org', async () => {
      const org1 = await createTestOrg({ name: 'Org One', slug: 'org-one' });
      const org2 = await createTestOrg({ name: 'Org Two', slug: 'org-two' });
      const role2 = await createTestRole({ organizationId: org2.id, name: 'SUPER_ADMIN' });
      const user2 = await createTestUser({ organizationId: org2.id, roleId: role2.id });

      const token2 = authService.generateToken({
        userId: user2.id,
        organizationId: org2.id,
        roleId: role2.id,
        roleName: role2.name,
        email: user2.email
      });

      const res = await request(app)
        .patch('/api/organization/current')
        .set('Cookie', [`vynexa_token=${token2}`])
        .send({ slug: 'org-one' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_SLUG');
    });

    it('should return 404 NOT_FOUND when requesting or updating non-existent organization', async () => {
      const token = authService.generateToken({
        userId: 'non-existent-user-id',
        organizationId: '3c8e4202-6b94-4d87-8fb2-e3e7f415ef99',
        roleId: 'role-id',
        roleName: 'SUPER_ADMIN',
        email: 'ghost@acme.com'
      });

      const resGet = await request(app)
        .get('/api/organization/current')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(resGet.status).toBe(404);
      expect(resGet.body.success).toBe(false);

      const resPatch = await request(app)
        .patch('/api/organization/current')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ name: 'Ghost Org' });

      expect(resPatch.status).toBe(404);
      expect(resPatch.body.success).toBe(false);
    });
  });
});
