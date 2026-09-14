import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestContact } from '../factories/contact.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestTask } from '../factories/task.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Tasks API Routes (/api/tasks) (API integration)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: superAdminRole.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: user.email
    });
  });

  describe('GET /api/tasks', () => {
    it('should return 401 UNAUTHORIZED when no auth token provided', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });

    it('should list tasks with pagination metadata', async () => {
      await createTestTask({ organizationId: org.id, createdById: user.id, title: 'Task 1' });
      await createTestTask({ organizationId: org.id, createdById: user.id, title: 'Task 2' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter tasks by status and priority', async () => {
      await createTestTask({ organizationId: org.id, createdById: user.id, title: 'Urgent Task', priority: 'URGENT', status: 'TODO' });
      await createTestTask({ organizationId: org.id, createdById: user.id, title: 'Low Task', priority: 'LOW', status: 'COMPLETED' });

      const res = await request(app)
        .get('/api/tasks?priority=URGENT&status=TODO')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Urgent Task');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a task with default TODO and MEDIUM priority', async () => {
      const payload = {
        title: 'Call CEO for introductory discussion'
      };

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Call CEO for introductory discussion');
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.priority).toBe('MEDIUM');
      expect(res.body.data.createdById).toBe(user.id);
    });

    it('should reject task creation when contact does not belong to specified account', async () => {
      const accountA = await createTestAccount({ organizationId: org.id, name: 'Account Alpha' });
      const accountB = await createTestAccount({ organizationId: org.id, name: 'Account Beta' });
      const contactB = await createTestContact({ organizationId: org.id, accountId: accountB.id });

      const payload = {
        title: 'Mismatched Task',
        accountId: accountA.id,
        contactId: contactB.id
      };

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('RELATIONAL_CONSISTENCY_ERROR');
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('should set completedAt when transitioned to COMPLETED', async () => {
      const task = await createTestTask({
        organizationId: org.id,
        createdById: user.id,
        status: 'TODO'
      });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();
      expect(res.body.data.completedAt).not.toBeNull();
    });

    it('should clear completedAt when transitioned from COMPLETED back to TODO', async () => {
      const task = await createTestTask({
        organizationId: org.id,
        createdById: user.id,
        status: 'COMPLETED',
        completedAt: new Date()
      });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ status: 'TODO' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.completedAt).toBeNull();
    });
  });

  describe('PATCH /api/tasks/:id/assign', () => {
    it('should assign task to another user and record audit log', async () => {
      const assignee = await createTestUser({
        organizationId: org.id,
        roleId: superAdminRole.id,
        email: 'assignee@vynexa.com'
      });

      const task = await createTestTask({
        organizationId: org.id,
        createdById: user.id
      });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}/assign`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ assignedToId: assignee.id });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedToId).toBe(assignee.id);
    });

    it('should reject assignment to user from different organization', async () => {
      const otherOrg = await createTestOrg({ name: 'External Org' });
      const otherRole = await createTestRole({ organizationId: otherOrg.id, name: 'SUPER_ADMIN' });
      const foreignUser = await createTestUser({
        organizationId: otherOrg.id,
        roleId: otherRole.id,
        email: 'foreign@other.com'
      });

      const task = await createTestTask({
        organizationId: org.id,
        createdById: user.id
      });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}/assign`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ assignedToId: foreignUser.id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ASSIGNEE');
    });
  });

  describe('GET /api/tasks/follow-ups', () => {
    it('should categorize tasks into overdue, today, and upcoming', async () => {
      const yesterday = new Date(Date.now() - 86400000 * 2).toISOString();
      const today = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 86400000 * 5).toISOString();

      await createTestTask({
        organizationId: org.id,
        createdById: user.id,
        title: 'Overdue Task',
        dueDate: new Date(yesterday),
        status: 'TODO'
      });
      await createTestTask({
        organizationId: org.id,
        createdById: user.id,
        title: 'Today Task',
        dueDate: new Date(today),
        status: 'TODO'
      });
      await createTestTask({
        organizationId: org.id,
        createdById: user.id,
        title: 'Upcoming Task',
        dueDate: new Date(nextWeek),
        status: 'TODO'
      });

      const res = await request(app)
        .get('/api/tasks/follow-ups')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.overdue).toBeDefined();
      expect(res.body.data.today).toBeDefined();
      expect(res.body.data.upcoming).toBeDefined();
      expect(res.body.data.counts).toBeDefined();
      expect(res.body.data.counts.total).toBe(3);
    });
  });
});
