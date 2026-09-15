import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestAuditLog } from '../factories/auditLog.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Audit Logs API Routes (/api/audit-logs)', () => {
  let org: any;
  let adminRole: any;
  let adminUser: any;
  let token: string;

  beforeEach(async () => {
    org = await createTestOrg();
    adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    adminUser = await createTestUser({
      organizationId: org.id,
      roleId: adminRole.id,
      email: `admin_${Math.random().toString(36).substring(2, 7)}@vynexa.test`
    });

    token = authService.generateToken({
      userId: adminUser.id,
      organizationId: org.id,
      roleId: adminRole.id,
      roleName: adminRole.name,
      email: adminUser.email
    });
  });

  describe('GET /api/audit-logs', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/audit-logs');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return paginated list of audit logs for the organization', async () => {
      await createTestAuditLog({ organizationId: org.id, action: 'LEAD_CREATED', entity: 'Lead' });
      await createTestAuditLog({ organizationId: org.id, action: 'QUOTE_APPROVED', entity: 'Quote' });

      const res = await request(app)
        .get('/api/audit-logs')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });

    it('should filter audit logs by entity and action', async () => {
      await createTestAuditLog({ organizationId: org.id, action: 'SPECIAL_EVENT_ALPHA', entity: 'Account' });
      await createTestAuditLog({ organizationId: org.id, action: 'SPECIAL_EVENT_BETA', entity: 'Contact' });

      const res = await request(app)
        .get('/api/audit-logs?entity=Account&action=SPECIAL_EVENT_ALPHA')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('SPECIAL_EVENT_ALPHA');
      expect(res.body.data[0].entity).toBe('Account');
    });

    it('should search audit logs by keyword', async () => {
      await createTestAuditLog({ organizationId: org.id, action: 'TARGET_KEYWORD_EVENT', entity: 'Opportunity' });

      const res = await request(app)
        .get('/api/audit-logs?search=TARGET_KEYWORD_EVENT')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.some((l: any) => l.action === 'TARGET_KEYWORD_EVENT')).toBe(true);
    });

    it('should reject invalid date ranges with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/audit-logs?startDate=2026-12-31&endDate=2026-01-01')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid pagination parameters with 400', async () => {
      const res = await request(app)
        .get('/api/audit-logs?page=-5&limit=5000')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/audit-logs/:id', () => {
    it('should return audit log detail by ID', async () => {
      const log = await createTestAuditLog({
        organizationId: org.id,
        action: 'ORDER_PLACED',
        entity: 'Order',
        metadata: { invoiceId: 'INV-9900' }
      });

      const res = await request(app)
        .get(`/api/audit-logs/${log.id}`)
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(log.id);
      expect(res.body.data.action).toBe('ORDER_PLACED');
    });

    it('should return 404 when audit log does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/audit-logs/${nonExistentId}`)
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for malformed non-UUID id', async () => {
      const res = await request(app)
        .get('/api/audit-logs/invalid-uuid-format')
        .set('Cookie', [`vynexa_token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Immutability & Read-Only Protection', () => {
    it('should reject POST mutations to audit logs with 404 NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/audit-logs')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ action: 'FORGED_EVENT' });

      expect(res.status).toBe(404);
    });

    it('should reject PUT / PATCH / DELETE mutations to audit logs with 404 NOT_FOUND', async () => {
      const log = await createTestAuditLog({ organizationId: org.id });

      const patchRes = await request(app)
        .patch(`/api/audit-logs/${log.id}`)
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ action: 'MODIFIED_EVENT' });
      expect(patchRes.status).toBe(404);

      const deleteRes = await request(app)
        .delete(`/api/audit-logs/${log.id}`)
        .set('Cookie', [`vynexa_token=${token}`]);
      expect(deleteRes.status).toBe(404);
    });
  });
});
