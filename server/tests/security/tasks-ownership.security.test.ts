import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestTask } from '../factories/task.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Tasks Ownership & Authorization Rules (security)', () => {
  let org: any;
  let repRole: any;
  let managerRole: any;
  let userAlice: any; // Assignee
  let userBob: any;   // Unrelated sales rep
  let userCharlie: any; // Task creator
  let userManager: any; // Sales Manager
  let tokenAlice: string;
  let tokenBob: string;
  let tokenCharlie: string;
  let tokenManager: string;
  let aliceTask: any;

  async function grantTasksPermissions(roleId: string) {
    const actions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN'];
    for (const action of actions) {
      let perm = await prismaTest.permission.findFirst({
        where: { resource: 'tasks', action }
      });
      if (!perm) {
        perm = await prismaTest.permission.create({
          data: { resource: 'tasks', action, description: `Tasks ${action}` }
        });
      }
      await prismaTest.rolePermission.create({
        data: { roleId, permissionId: perm.id }
      });
    }
  }

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    repRole = await createTestRole({ organizationId: org.id, name: 'SALES_REPRESENTATIVE' });
    managerRole = await createTestRole({ organizationId: org.id, name: 'SALES_MANAGER' });

    // Grant standard tasks permissions to both roles so we specifically test domain ownership
    await grantTasksPermissions(repRole.id);
    await grantTasksPermissions(managerRole.id);

    userAlice = await createTestUser({
      organizationId: org.id,
      roleId: repRole.id,
      email: 'alice@vynexa.com'
    });
    tokenAlice = authService.generateToken({
      userId: userAlice.id,
      organizationId: org.id,
      roleId: repRole.id,
      roleName: repRole.name,
      email: userAlice.email
    });

    userBob = await createTestUser({
      organizationId: org.id,
      roleId: repRole.id,
      email: 'bob@vynexa.com'
    });
    tokenBob = authService.generateToken({
      userId: userBob.id,
      organizationId: org.id,
      roleId: repRole.id,
      roleName: repRole.name,
      email: userBob.email
    });

    userCharlie = await createTestUser({
      organizationId: org.id,
      roleId: repRole.id,
      email: 'charlie@vynexa.com'
    });
    tokenCharlie = authService.generateToken({
      userId: userCharlie.id,
      organizationId: org.id,
      roleId: repRole.id,
      roleName: repRole.name,
      email: userCharlie.email
    });

    userManager = await createTestUser({
      organizationId: org.id,
      roleId: managerRole.id,
      email: 'manager@vynexa.com'
    });
    tokenManager = authService.generateToken({
      userId: userManager.id,
      organizationId: org.id,
      roleId: managerRole.id,
      roleName: managerRole.name,
      email: userManager.email
    });

    // Create task assigned to Alice, created by Charlie
    aliceTask = await createTestTask({
      organizationId: org.id,
      createdById: userCharlie.id,
      assignedToId: userAlice.id,
      title: "Alice's Assigned Task"
    });
  });

  describe('Task Completion Authorization', () => {
    it("should reject User Bob from completing User Alice's task with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/complete`)
        .set('Cookie', [`vynexa_token=${tokenBob}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('assigned to another user');
    });

    it('should allow User Alice (assignee) to complete her own task', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/complete`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it("should allow User Charlie (creator) to complete Alice's task", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/complete`)
        .set('Cookie', [`vynexa_token=${tokenCharlie}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it("should allow Sales Manager to complete Alice's task", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/complete`)
        .set('Cookie', [`vynexa_token=${tokenManager}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Task Status Changes & Updates Authorization', () => {
    it("should reject User Bob from changing status of Alice's task with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/status`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should reject User Bob from updating Alice's task details with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ title: 'Tampered Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow User Alice to update her task details", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}`)
        .set('Cookie', [`vynexa_token=${tokenAlice}`])
        .send({ title: 'Updated Title by Alice' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title by Alice');
    });
  });

  describe('Task Reassignment Authorization', () => {
    it("should reject User Bob from reassigning Alice's task with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenBob}`])
        .send({ assignedToId: userBob.id });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow Sales Manager to reassign Alice's task to Bob", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${aliceTask.id}/assign`)
        .set('Cookie', [`vynexa_token=${tokenManager}`])
        .send({ assignedToId: userBob.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedToId).toBe(userBob.id);
    });
  });

  describe('Task Deletion Authorization', () => {
    it("should reject User Bob from deleting Alice's task with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${aliceTask.id}`)
        .set('Cookie', [`vynexa_token=${tokenBob}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it("should allow Sales Manager to delete Alice's task", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${aliceTask.id}`)
        .set('Cookie', [`vynexa_token=${tokenManager}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
