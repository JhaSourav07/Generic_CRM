import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestNotification } from '../factories/notification.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Notifications Security & User Isolation (security)', () => {
  let org: any;
  let role: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    role = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });

    userA = await createTestUser({ organizationId: org.id, roleId: role.id, email: 'usera@crm.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: userA.email
    });

    userB = await createTestUser({ organizationId: org.id, roleId: role.id, email: 'userb@crm.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: userB.email
    });
  });

  describe('User Isolation & Privacy Enforcement', () => {
    it('should prevent User A from viewing User B notification via GET /api/notifications/:id', async () => {
      const notifB = await createTestNotification({
        organizationId: org.id,
        userId: userB.id,
        title: 'Private Alert for User B'
      });

      const res = await request(app)
        .get(`/api/notifications/${notifB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should prevent User A from marking User B notification as read via PATCH /api/notifications/:id/read', async () => {
      const notifB = await createTestNotification({
        organizationId: org.id,
        userId: userB.id,
        isRead: false
      });

      const res = await request(app)
        .patch(`/api/notifications/${notifB.id}/read`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should prevent User A from deleting User B notification via DELETE /api/notifications/:id', async () => {
      const notifB = await createTestNotification({
        organizationId: org.id,
        userId: userB.id
      });

      const res = await request(app)
        .delete(`/api/notifications/${notifB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should never include User B notifications in User A notification feed', async () => {
      await createTestNotification({ organizationId: org.id, userId: userA.id, title: 'Alert for A' });
      await createTestNotification({ organizationId: org.id, userId: userB.id, title: 'Secret for B' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Alert for A');
    });
  });
});
