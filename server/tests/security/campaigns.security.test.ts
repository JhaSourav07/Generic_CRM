import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestCampaign } from '../factories/campaign.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Marketing Campaigns Security & Multi-Tenancy Tests', () => {
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

  it('should prevent User from Organization A from viewing Organization B campaigns', async () => {
    const campaignB = await createTestCampaign({ organizationId: orgB.id, createdById: userB.id, name: 'Org B Secret Promo' });

    const res = await request(app)
      .get(`/api/campaigns/${campaignB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('should prevent User from Organization A from updating Organization B campaigns', async () => {
    const campaignB = await createTestCampaign({ organizationId: orgB.id, createdById: userB.id });

    const res = await request(app)
      .patch(`/api/campaigns/${campaignB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`])
      .send({ name: 'Hacked by Org A' });

    expect(res.status).toBe(404);
  });

  it('should prevent User from Organization A from deleting Organization B campaigns', async () => {
    const campaignB = await createTestCampaign({ organizationId: orgB.id, createdById: userB.id });

    const res = await request(app)
      .delete(`/api/campaigns/${campaignB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('should prevent attaching a lead from Organization B to an Organization A campaign', async () => {
    const campaignA = await createTestCampaign({ organizationId: orgA.id, createdById: userA.id });
    const leadB = await createTestLead({ organizationId: orgB.id });

    const res = await request(app)
      .post(`/api/campaigns/${campaignA.id}/leads/${leadB.id}`)
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('should reject bulk lead association if any lead belongs to another organization', async () => {
    const campaignA = await createTestCampaign({ organizationId: orgA.id, createdById: userA.id });
    const leadA = await createTestLead({ organizationId: orgA.id });
    const leadB = await createTestLead({ organizationId: orgB.id });

    const res = await request(app)
      .post(`/api/campaigns/${campaignA.id}/leads/bulk`)
      .set('Cookie', [`vynexa_token=${tokenA}`])
      .send({ leadIds: [leadA.id, leadB.id] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LEADS');
  });
});
