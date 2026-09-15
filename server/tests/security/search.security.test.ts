import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Global Search Security & Multi-Tenancy (security)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('should enforce strict tenant boundary and never return Organization B data to Organization A user', async () => {
    // Org A
    const orgA = await createTestOrg({ name: 'Organization Alpha' });
    const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    const userA = await createTestUser({
      organizationId: orgA.id,
      roleId: roleA.id,
      name: 'User Alpha',
      email: 'alpha@test.com'
    });
    const tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });

    // Org B
    const orgB = await createTestOrg({ name: 'Organization Beta' });
    const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    const userB = await createTestUser({
      organizationId: orgB.id,
      roleId: roleB.id,
      name: 'User Beta',
      email: 'beta@test.com'
    });

    // Create a target record exclusively in Org B
    await createTestLead({
      organizationId: orgB.id,
      firstName: 'Classified',
      lastName: 'ProjectBeta',
      company: 'Confidential Beta Inc',
      email: 'secret@beta.com'
    });

    await createTestAccount({
      organizationId: orgB.id,
      name: 'Confidential Beta Defense Corp'
    });

    // User A searches for "Confidential"
    const res = await request(app)
      .get('/api/search?q=Confidential')
      .set('Cookie', [`vynexa_token=${tokenA}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMatches).toBe(0);
    expect(res.body.data.results.length).toBe(0);
    expect(res.body.data.grouped.leads.length).toBe(0);
    expect(res.body.data.grouped.customers.length).toBe(0);
  });

  it('should exclude soft-deleted records from search results', async () => {
    const org = await createTestOrg({ name: 'Soft Delete Test Org' });
    const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });
    const token = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: user.email
    });

    // Create an active lead
    await createTestLead({
      organizationId: org.id,
      firstName: 'Active',
      lastName: 'ArchivedTarget',
      company: 'Target Corp'
    });

    // Create a soft-deleted lead
    const deletedLead = await createTestLead({
      organizationId: org.id,
      firstName: 'Deleted',
      lastName: 'ArchivedTarget',
      company: 'Target Corp'
    });
    await prismaTest.lead.update({
      where: { id: deletedLead.id },
      data: { deletedAt: new Date() }
    });

    // Search for "ArchivedTarget"
    const res = await request(app)
      .get('/api/search?q=ArchivedTarget')
      .set('Cookie', [`vynexa_token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.grouped.leads.length).toBe(1);
    expect(res.body.data.grouped.leads[0].title).toContain('Active ArchivedTarget');
    expect(res.body.data.grouped.leads[0].id).not.toBe(deletedLead.id);
  });

  it('should not leak sensitive fields such as passwordHash, tokens, or private secrets in search results', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });
    const token = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: role.id,
      roleName: role.name,
      email: user.email
    });

    await createTestLead({
      organizationId: org.id,
      firstName: 'Privacy',
      lastName: 'Auditor',
      company: 'Privacy Corp'
    });

    const res = await request(app)
      .get('/api/search?q=Privacy')
      .set('Cookie', [`vynexa_token=${token}`]);

    expect(res.status).toBe(200);
    const bodyString = JSON.stringify(res.body);

    expect(bodyString).not.toContain('passwordHash');
    expect(bodyString).not.toContain('password');
    expect(bodyString).not.toContain('token');
    expect(bodyString).not.toContain('secret');
  });

  it('should enforce RBAC permissions and filter out unauthorized resources for restricted roles', async () => {
    const org = await createTestOrg();
    // Role with only leads:VIEW permission (no quotes:VIEW)
    const restrictedRole = await createTestRole({
      organizationId: org.id,
      name: 'RESTRICTED_ROLE'
    });

    // Add ONLY leads:VIEW permission
    const leadsViewPerm = await prismaTest.permission.upsert({
      where: { resource_action: { resource: 'leads', action: 'VIEW' } },
      update: {},
      create: { resource: 'leads', action: 'VIEW' }
    });

    await prismaTest.rolePermission.create({
      data: {
        roleId: restrictedRole.id,
        permissionId: leadsViewPerm.id
      }
    });

    const restrictedUser = await createTestUser({
      organizationId: org.id,
      roleId: restrictedRole.id,
      name: 'Restricted User',
      email: 'restricted@test.com'
    });

    const token = authService.generateToken({
      userId: restrictedUser.id,
      organizationId: org.id,
      roleId: restrictedRole.id,
      roleName: restrictedRole.name,
      email: restrictedUser.email
    });

    // Create a Lead matching "OmniCorp"
    await createTestLead({
      organizationId: org.id,
      firstName: 'Lead',
      lastName: 'OmniCorp',
      company: 'OmniCorp Global'
    });

    // Create a Quote matching "OmniCorp" (which user is NOT authorized to view)
    await createTestQuote({
      organizationId: org.id,
      createdById: restrictedUser.id,
      quoteNumber: 'Q-OmniCorp-01'
    });

    const res = await request(app)
      .get('/api/search?q=OmniCorp')
      .set('Cookie', [`vynexa_token=${token}`]);

    expect(res.status).toBe(200);
    // User sees the lead
    expect(res.body.data.grouped.leads.length).toBe(1);
    expect(res.body.data.grouped.leads[0].title).toContain('OmniCorp');
    // Quotes must be empty because user lacks quotes:VIEW permission
    expect(res.body.data.grouped.quotes.length).toBe(0);
  });
});
