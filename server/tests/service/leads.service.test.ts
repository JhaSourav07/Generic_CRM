import { describe, it, expect, beforeEach } from 'vitest';
import { leadsService } from '../../src/modules/leads/leads.service.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { prismaTest, clearTestDb } from '../helpers/testDb.js';
import { LeadStatus } from '@prisma/client';

describe('LeadsService (unit & database integration)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  it('should list leads with pagination, search, and status filter', async () => {
    const org = await createTestOrg();
    await createTestLead({ organizationId: org.id, firstName: 'John', lastName: 'Doe', company: 'Acme', status: LeadStatus.NEW });
    await createTestLead({ organizationId: org.id, firstName: 'Jane', lastName: 'Smith', company: 'Beta', status: LeadStatus.QUALIFIED });

    const result = await leadsService.getLeads(org.id, { page: 1, limit: 10 });
    expect(result.leads.length).toBe(2);
    expect(result.meta.total).toBe(2);

    const searchResult = await leadsService.getLeads(org.id, { search: 'Jane' });
    expect(searchResult.leads.length).toBe(1);
    expect(searchResult.leads[0].firstName).toBe('Jane');

    const statusResult = await leadsService.getLeads(org.id, { status: LeadStatus.QUALIFIED });
    expect(statusResult.leads.length).toBe(1);
    expect(statusResult.leads[0].status).toBe('QUALIFIED');
  });

  it('should create lead and record audit log', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });

    const lead = await leadsService.createLead(org.id, user.id, {
      firstName: 'Robert',
      lastName: 'Paulson',
      email: 'robert@fightclub.com',
      company: 'Paper Co',
      score: 80
    });

    expect(lead.id).toBeDefined();
    expect(lead.firstName).toBe('Robert');

    // Audit Log Check
    const auditLogs = await prismaTest.auditLog.findMany({ where: { organizationId: org.id, entityId: lead.id } });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].action).toBe('LEAD_CREATED');
  });

  it('should block creating duplicate lead with identical email in organization', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });

    await createTestLead({ organizationId: org.id, email: 'duplicate@test.com' });

    await expect(
      leadsService.createLead(org.id, user.id, {
        firstName: 'New',
        lastName: 'Person',
        email: 'duplicate@test.com'
      })
    ).rejects.toThrow('Potential duplicate lead already exists');
  });

  it('should assign lead to active organization user', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user1 = await createTestUser({ organizationId: org.id, roleId: role.id });
    const user2 = await createTestUser({ organizationId: org.id, roleId: role.id });

    const lead = await createTestLead({ organizationId: org.id, ownerId: user1.id });

    const assigned = await leadsService.assignLead(org.id, user1.id, lead.id, user2.id);
    expect(assigned.ownerId).toBe(user2.id);
  });

  it('should soft delete lead', async () => {
    const org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id });
    const user = await createTestUser({ organizationId: org.id, roleId: role.id });
    const lead = await createTestLead({ organizationId: org.id });

    await leadsService.deleteLead(org.id, user.id, lead.id);

    await expect(leadsService.getLeadById(org.id, lead.id)).rejects.toThrow('Lead not found');
  });
});
