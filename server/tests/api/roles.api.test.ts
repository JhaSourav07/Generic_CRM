import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Roles & Permissions API Routes (/api/roles, /api/permissions)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('GET /api/permissions', () => {
    it('should list available permissions', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({ organizationId: org.id, roleId: adminRole.id });

      // Seed sample permission
      await prismaTest.permission.create({
        data: { resource: 'leads', action: 'VIEW', description: 'View leads' }
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: 'SUPER_ADMIN',
        email: adminUser.email
      });

      const res = await request(app)
        .get('/api/permissions')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/roles', () => {
    it('should create a custom tenant role with mapped permissions in a transaction', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({ organizationId: org.id, roleId: adminRole.id });

      const perm1 = await prismaTest.permission.create({
        data: { resource: 'leads', action: 'CREATE', description: 'Create leads' }
      });
      const perm2 = await prismaTest.permission.create({
        data: { resource: 'leads', action: 'VIEW', description: 'View leads' }
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: 'SUPER_ADMIN',
        email: adminUser.email
      });

      const res = await request(app)
        .post('/api/roles')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'Lead Specialist',
          description: 'Can view and create leads',
          permissionIds: [perm1.id, perm2.id]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Lead Specialist');
      expect(res.body.data.organizationId).toBe(org.id);
      expect(res.body.data.permissions.length).toBe(2);
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('should prevent deleting system default roles', async () => {
      const org = await createTestOrg();
      // System role has organizationId: null
      const sysRole = await createTestRole({ organizationId: null, name: 'SYSTEM_SUPER_ADMIN' });
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({ organizationId: org.id, roleId: adminRole.id });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: 'SUPER_ADMIN',
        email: adminUser.email
      });

      const res = await request(app)
        .delete(`/api/roles/${sysRole.id}`)
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SYSTEM_ROLE_PROTECTED');
    });

    it('should prevent deleting role assigned to active users', async () => {
      const org = await createTestOrg();
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({ organizationId: org.id, roleId: adminRole.id });

      const customRole = await createTestRole({ organizationId: org.id, name: 'Custom Sales' });
      await createTestUser({ organizationId: org.id, roleId: customRole.id, email: 'sales@acme.com' });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: 'SUPER_ADMIN',
        email: adminUser.email
      });

      const res = await request(app)
        .delete(`/api/roles/${customRole.id}`)
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROLE_IN_USE');
    });
  });
});
