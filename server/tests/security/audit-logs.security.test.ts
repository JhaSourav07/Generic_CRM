import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestAuditLog } from '../factories/auditLog.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Audit Logs Security & Multi-Tenancy Tests', () => {
  let orgA: any;
  let orgB: any;
  let userA: any;
  let userB: any;
  let roleA: any;
  let roleB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    orgA = await createTestOrg({ name: 'Security Org A' });
    orgB = await createTestOrg({ name: 'Security Org B' });

    roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });

    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id });

    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });

    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
  });

  it('should prevent User in Organization A from listing Organization B audit logs', async () => {
    await createTestAuditLog({ organizationId: orgA.id, action: 'ORG_A_CONFIDENTIAL_EVENT' });
    await createTestAuditLog({ organizationId: orgB.id, action: 'ORG_B_CONFIDENTIAL_EVENT' });

    const resA = await request(app)
      .get('/api/audit-logs')
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(resA.status).toBe(200);
    const actionsA = resA.body.data.map((l: any) => l.action);
    expect(actionsA).toContain('ORG_A_CONFIDENTIAL_EVENT');
    expect(actionsA).not.toContain('ORG_B_CONFIDENTIAL_EVENT');

    const resB = await request(app)
      .get('/api/audit-logs')
      .set('Cookie', [`vynexa_token=${tokenB}`]);

    expect(resB.status).toBe(200);
    const actionsB = resB.body.data.map((l: any) => l.action);
    expect(actionsB).toContain('ORG_B_CONFIDENTIAL_EVENT');
    expect(actionsB).not.toContain('ORG_A_CONFIDENTIAL_EVENT');
  });

  it('should prevent User in Organization A from reading Organization B audit log by ID (IDOR)', async () => {
    const logB = await createTestAuditLog({ organizationId: orgB.id, action: 'SECRET_PAYLOAD' });

    const res = await request(app)
      .get(`/api/audit-logs/${logB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should redact sensitive credentials and secrets from audit log payloads', async () => {
    const log = await createTestAuditLog({
      organizationId: orgA.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      oldValue: {
        username: 'alice',
        passwordHash: '$2a$10$supersecretstringthatshouldnotappear'
      },
      newValue: {
        username: 'alice_new',
        password: 'RawPassword123!',
        token: 'eySecretToken123',
        secret: 'topSecretKey'
      },
      metadata: {
        creditCard: '4111-2222-3333-4444',
        safeProperty: 'visible'
      }
    });

    const res = await request(app)
      .get(`/api/audit-logs/${log.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Sensitive values must be scrubbed as [REDACTED]
    expect(data.oldValue.passwordHash).toBe('[REDACTED]');
    expect(data.newValue.password).toBe('[REDACTED]');
    expect(data.newValue.token).toBe('[REDACTED]');
    expect(data.newValue.secret).toBe('[REDACTED]');
    expect(data.metadata.creditCard).toBe('[REDACTED]');

    // Safe property must remain intact
    expect(data.metadata.safeProperty).toBe('visible');
    expect(data.oldValue.username).toBe('alice');
  });

  it('should reject non-admin users without audit_logs permission with 403 FORBIDDEN', async () => {
    const restrictedRole = await createTestRole({ organizationId: orgA.id, name: 'STAFF_MEMBER' });
    const restrictedUser = await createTestUser({ organizationId: orgA.id, roleId: restrictedRole.id });

    const restrictedToken = authService.generateToken({
      userId: restrictedUser.id,
      organizationId: orgA.id,
      roleId: restrictedRole.id,
      roleName: restrictedRole.name,
      email: restrictedUser.email
    });

    const res = await request(app)
      .get('/api/audit-logs')
      .set('Cookie', [`vynexa_token=${restrictedToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
