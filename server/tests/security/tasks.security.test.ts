import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestTask } from '../factories/task.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Tasks Security, IDOR & Multi-Tenancy Attacks (security)', () => {
  let orgA: any;
  let userA: any;
  let tokenA: string;
  let accountA: any;
  let taskA: any;

  let orgB: any;
  let userB: any;
  let tokenB: string;
  let accountB: any;
  let taskB: any;

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
    taskA = await createTestTask({
      organizationId: orgA.id,
      createdById: userA.id,
      accountId: accountA.id,
      title: 'Org A Confidential Task'
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
    taskB = await createTestTask({
      organizationId: orgB.id,
      createdById: userB.id,
      accountId: accountB.id,
      title: 'Org B Secret Task'
    });
  });

  describe('IDOR Cross-Tenant Isolation', () => {
    it('should block Org A user from reading Org B task via GET', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from updating status of Org B task', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskB.id}/status`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from reassigning Org B task', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskB.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ assignedToId: userA.id });

      expect(res.status).toBe(404);
    });

    it('should block Org A user from deleting Org B task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A user from creating task referencing Org B account', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          title: 'Cross-Tenant Exploit',
          accountId: accountB.id // from Org B
        });

      expect(res.status).toBe(404);
    });
  });

  describe('RBAC Authorization Boundaries', () => {
    it('should reject task status update when user role lacks tasks:edit permission', async () => {
      const readOnlyRole = await createTestRole({
        organizationId: orgA.id,
        name: 'AUDITOR',
        permissions: ['tasks:read']
      });
      const auditorUser = await createTestUser({
        organizationId: orgA.id,
        roleId: readOnlyRole.id,
        email: 'auditor@orga.com'
      });
      const auditorToken = authService.generateToken({
        userId: auditorUser.id,
        organizationId: orgA.id,
        roleId: readOnlyRole.id,
        roleName: readOnlyRole.name,
        email: auditorUser.email
      });

      const res = await request(app)
        .patch(`/api/tasks/${taskA.id}/status`)
        .set('Cookie', [`vynexa_token=${auditorToken}`])
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(403);
    });
  });
});
