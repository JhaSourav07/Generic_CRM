import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Users API Routes (/api/users)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('GET /api/users', () => {
    it('should return 401 UNAUTHORIZED when unauthenticated', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return paginated list of users for authenticated org user', async () => {
      const org = await createTestOrg({ name: 'Acme Corp' });
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Admin User',
        email: 'admin@acme.com'
      });

      const memberRole = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });
      await createTestUser({
        organizationId: org.id,
        roleId: memberRole.id,
        name: 'John Doe',
        email: 'john@acme.com'
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      const res = await request(app)
        .get('/api/users')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.data[0]).not.toHaveProperty('passwordHash');
    });

    it('should filter users by search term', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Alice Manager',
        email: 'alice@acme.com'
      });

      const memberRole = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });
      await createTestUser({
        organizationId: org.id,
        roleId: memberRole.id,
        name: 'Bob Sales',
        email: 'bob@acme.com'
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      const res = await request(app)
        .get('/api/users?search=Bob')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Bob Sales');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new team user in the active organization', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id
      });
      const repRole = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'New Agent',
          email: 'agent@acme.com',
          password: 'Password123!',
          roleId: repRole.id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('agent@acme.com');
      expect(res.body.data.organizationId).toBe(org.id);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should reject creating duplicate email in same organization', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        email: 'duplicate@acme.com'
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'Duplicate User',
          email: 'duplicate@acme.com',
          password: 'Password123!',
          roleId: adminRole.id
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('PATCH /api/users/:id/status (Last Admin Protection)', () => {
    it('should prevent deactivating the organization\'s last active admin', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        isActive: true
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      const res = await request(app)
        .patch(`/api/users/${adminUser.id}/status`)
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTION');
    });

    it('should allow deactivating an admin if another active admin exists', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser1 = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        email: 'admin1@acme.com'
      });
      const adminUser2 = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        email: 'admin2@acme.com'
      });

      const token = authService.generateToken({
        userId: adminUser1.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser1.email
      });

      const res = await request(app)
        .patch(`/api/users/${adminUser2.id}/status`)
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });
  });
});
