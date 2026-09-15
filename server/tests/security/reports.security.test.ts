import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Reports & Analytics Security & CSV Export Tests', () => {
  let orgA: any;
  let orgB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await clearTestDb();

    orgA = await createTestOrg({ name: 'Organization A' });
    orgB = await createTestOrg({ name: 'Organization B' });

    const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });

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

  it('should enforce strict multi-tenancy in report aggregations', async () => {
    // 2 leads in Org A, 5 leads in Org B
    await createTestLead({ organizationId: orgA.id, status: 'QUALIFIED' });
    await createTestLead({ organizationId: orgA.id, status: 'CONVERTED' });

    await createTestLead({ organizationId: orgB.id, status: 'QUALIFIED' });
    await createTestLead({ organizationId: orgB.id, status: 'QUALIFIED' });
    await createTestLead({ organizationId: orgB.id, status: 'QUALIFIED' });
    await createTestLead({ organizationId: orgB.id, status: 'QUALIFIED' });
    await createTestLead({ organizationId: orgB.id, status: 'QUALIFIED' });

    // Org A request
    const resA = await request(app)
      .get('/api/reports/leads')
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(resA.status).toBe(200);
    expect(resA.body.data.totalLeads).toBe(2);

    // Org B request
    const resB = await request(app)
      .get('/api/reports/leads')
      .set('Cookie', [`vynexa_token=${tokenB}`]);

    expect(resB.status).toBe(200);
    expect(resB.body.data.totalLeads).toBe(5);
  });

  it('should stream CSV export with formula injection protection', async () => {
    // Lead with malicious formula injection payload
    await createTestLead({
      organizationId: orgA.id,
      firstName: '=cmd|’ /C calc’!A0',
      lastName: '+123456789',
      company: '@malicious-domain'
    });

    const res = await request(app)
      .get('/api/reports/leads/export')
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('.csv');

    const csv = res.text;
    // Malicious cells must be sanitized with a leading single quote
    expect(csv).toContain("'=cmd|’ /C calc’!A0");
    expect(csv).toContain("'+123456789");
    expect(csv).toContain("'@malicious-domain");
  });

  it('should isolate CSV exports between organizations', async () => {
    await createTestLead({ organizationId: orgA.id, firstName: 'AliceOrgA' });
    await createTestLead({ organizationId: orgB.id, firstName: 'BobOrgB' });

    const res = await request(app)
      .get('/api/reports/leads/export')
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(200);
    expect(res.text).toContain('AliceOrgA');
    expect(res.text).not.toContain('BobOrgB');
  });

  it('should reject unauthorized users lacking export permission', async () => {
    // Create a role without export permission
    const restrictedRole = await createTestRole({ organizationId: orgA.id, name: 'RESTRICTED_STAFF' });
    const restrictedUser = await createTestUser({ organizationId: orgA.id, roleId: restrictedRole.id });

    const restrictedToken = authService.generateToken({
      userId: restrictedUser.id,
      organizationId: orgA.id,
      roleId: restrictedRole.id,
      roleName: restrictedRole.name,
      email: restrictedUser.email
    });

    const res = await request(app)
      .get('/api/reports/leads/export')
      .set('Cookie', [`vynexa_token=${restrictedToken}`]);

    expect(res.status).toBe(403);
  });
});
