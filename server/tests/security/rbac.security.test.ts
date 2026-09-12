import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('RBAC & Multi-Tenant Security Audits', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Cross-Tenant Data Isolation Checks', () => {
    it('should reject access to user details belonging to another organization (IDOR Defense)', async () => {
      // Org A
      const orgA = await createTestOrg({ name: 'Tenant Alpha' });
      const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
      const userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'admin@alpha.com' });

      // Org B
      const orgB = await createTestOrg({ name: 'Tenant Beta' });
      const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
      const userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'victim@beta.com' });

      const tokenA = authService.generateToken({
        userId: userA.id,
        organizationId: orgA.id,
        roleId: roleA.id,
        roleName: roleA.name,
        email: userA.email
      });

      // User A attempts to view User B from Org B
      const res = await request(app)
        .get(`/api/users/${userB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject update on user belonging to another organization', async () => {
      const orgA = await createTestOrg();
      const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
      const userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id });

      const orgB = await createTestOrg();
      const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
      const userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id });

      const tokenA = authService.generateToken({
        userId: userA.id,
        organizationId: orgA.id,
        roleId: roleA.id,
        roleName: roleA.name,
        email: userA.email
      });

      const res = await request(app)
        .put(`/api/users/${userB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject update on role belonging to another organization', async () => {
      const orgA = await createTestOrg();
      const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
      const userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id });

      const orgB = await createTestOrg();
      const roleB = await createTestRole({ organizationId: orgB.id, name: 'Custom Org B Role' });

      const tokenA = authService.generateToken({
        userId: userA.id,
        organizationId: orgA.id,
        roleId: roleA.id,
        roleName: roleA.name,
        email: userA.email
      });

      const res = await request(app)
        .put(`/api/roles/${roleB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ name: 'Attempted Highjack' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Permission Enforcement Checks', () => {
    it('should reject request when user lacks required permission', async () => {
      const org = await createTestOrg();
      // Role with NO permissions
      const restrictedRole = await createTestRole({ organizationId: org.id, name: 'RESTRICTED_ROLE' });
      const user = await createTestUser({ organizationId: org.id, roleId: restrictedRole.id });

      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: restrictedRole.id,
        roleName: restrictedRole.name,
        email: user.email
      });

      // Try creating a new role (requires users:write or settings:manage)
      const res = await request(app)
        .post('/api/roles')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ name: 'Unauthorized Role' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow request when user has explicit permission', async () => {
      const org = await createTestOrg();
      const customRole = await createTestRole({ organizationId: org.id, name: 'USER_ADMIN' });

      // Grant users write permission
      const writeUsersPerm = await prismaTest.permission.create({
        data: { resource: 'users', action: 'CREATE', description: 'Create users' }
      });
      await prismaTest.rolePermission.create({
        data: { roleId: customRole.id, permissionId: writeUsersPerm.id }
      });

      const user = await createTestUser({ organizationId: org.id, roleId: customRole.id });

      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: customRole.id,
        roleName: customRole.name,
        email: user.email
      });

      const targetRole = await createTestRole({ organizationId: org.id, name: 'TARGET_ROLE' });

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'Authorized Created User',
          email: 'authuser@acme.com',
          password: 'Password123!',
          roleId: targetRole.id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Authorized Created User');
    });

    it('should return true in hasPermission when database role is SUPER_ADMIN even if context role differs', async () => {
      const org = await createTestOrg();
      const superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const user = await createTestUser({ organizationId: org.id, roleId: superAdminRole.id, email: 'dbadmin@acme.com' });

      // Token claims role is RESTRICTED, but DB user is SUPER_ADMIN
      const token = authService.generateToken({
        userId: user.id,
        organizationId: org.id,
        roleId: superAdminRole.id,
        roleName: 'RESTRICTED_ROLE',
        email: 'dbadmin@acme.com'
      });

      const res = await request(app)
        .get('/api/users')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
