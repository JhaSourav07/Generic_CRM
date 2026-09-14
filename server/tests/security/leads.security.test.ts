import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Lead Security & Multi-Tenancy Isolation (security)', () => {
  let orgA: any;
  let orgB: any;
  let roleA: any;
  let roleB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;
  let leadB: any;

  beforeEach(async () => {
    await clearTestDb();

    orgA = await createTestOrg({ name: 'Organization A', slug: 'org-a' });
    orgB = await createTestOrg({ name: 'Organization B', slug: 'org-b' });

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

    leadB = await createTestLead({
      organizationId: orgB.id,
      firstName: 'Target Lead B',
      email: 'leadb@orgb.com'
    });
  });

  it('should block Org A from reading Org B lead by ID (404/IDOR Protection)', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('should block Org A from updating Org B lead', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`])
      .send({ firstName: 'Hacked Name' });

    expect(res.status).toBe(404);
  });

  it('should block Org A from deleting Org B lead', async () => {
    const res = await request(app)
      .delete(`/api/leads/${leadB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('should block Org A from assigning Org A lead to Org B user', async () => {
    const leadA = await createTestLead({ organizationId: orgA.id, firstName: 'Lead A' });

    const res = await request(app)
      .patch(`/api/leads/${leadA.id}/assign`)
      .set('Cookie', [`vynexa_token=${tokenA}`])
      .send({ ownerId: userB.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OWNER');
  });

  it('should block Org A from converting Org B lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadB.id}/convert`)
      .set('Cookie', [`vynexa_token=${tokenA}`])
      .send({});

    expect(res.status).toBe(404);
  });
});
