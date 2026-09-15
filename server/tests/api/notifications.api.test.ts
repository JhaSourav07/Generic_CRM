import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestNotification } from '../factories/notification.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Notifications API Routes (/api/notifications)', () => {
  let org: any;
  let role: any;
  let user: any;
  let authToken: string;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    role = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });
    user = await createTestUser({ organizationId: org.id, roleId: role.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: user.email
    });
  });

  describe('GET /api/notifications', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('should list notifications for the authenticated user with unreadCount in meta', async () => {
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: false });
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: true });

      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.unreadCount).toBe(1);
    });

    it('should filter notifications by isRead=false', async () => {
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: false, title: 'Unread Alert' });
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: true, title: 'Read Alert' });

      const res = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Unread Alert');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return the accurate count of unread notifications from PostgreSQL', async () => {
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: false });
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: false });
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: true });

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark a notification as read and set readAt timestamp', async () => {
      const notif = await createTestNotification({
        organizationId: org.id,
        userId: user.id,
        isRead: false
      });

      const res = await request(app)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).not.toBeNull();

      const dbNotif = await prismaTest.notification.findUnique({
        where: { id: notif.id }
      });
      expect(dbNotif?.isRead).toBe(true);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all unread notifications for user as read', async () => {
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: false });
      await createTestNotification({ organizationId: org.id, userId: user.id, isRead: false });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(2);

      const unread = await prismaTest.notification.count({
        where: { userId: user.id, isRead: false }
      });
      expect(unread).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification belonging to the current user', async () => {
      const notif = await createTestNotification({
        organizationId: org.id,
        userId: user.id
      });

      const res = await request(app)
        .delete(`/api/notifications/${notif.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const exists = await prismaTest.notification.findUnique({
        where: { id: notif.id }
      });
      expect(exists).toBeNull();
    });
  });
});
