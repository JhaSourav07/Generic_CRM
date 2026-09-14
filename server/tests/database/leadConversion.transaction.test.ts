import { describe, it, expect, beforeEach } from 'vitest';
import { leadsService } from '../../src/modules/leads/leads.service.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Lead Conversion Transaction & Atomic Rollback (database)', () => {
  let org: any;
  let role: any;
  let user: any;
  let pipeline: any;
  let stage: any;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    role = await createTestRole({ organizationId: org.id });
    user = await createTestUser({ organizationId: org.id, roleId: role.id });

    // Seed Pipeline and Stage for tenant
    pipeline = await prismaTest.pipeline.create({
      data: {
        organizationId: org.id,
        name: 'Standard Sales Pipeline',
        isDefault: true
      }
    });

    stage = await prismaTest.pipelineStage.create({
      data: {
        pipelineId: pipeline.id,
        name: 'Qualification',
        order: 1,
        probability: 20
      }
    });
  });

  it('should atomically convert lead to Account, Contact, and Opportunity in a single transaction', async () => {
    const lead = await createTestLead({
      organizationId: org.id,
      firstName: 'Bruce',
      lastName: 'Wayne',
      email: 'bruce@wayneenterprises.com',
      company: 'Wayne Enterprises',
      jobTitle: 'CEO'
    });

    const result = await leadsService.convertLead(org.id, user.id, lead.id, {
      account: { name: 'Wayne Enterprises Inc', industry: 'Defense & Tech' },
      contact: { firstName: 'Bruce', lastName: 'Wayne', jobTitle: 'CEO' },
      createOpportunity: true,
      opportunity: { name: 'Batmobile Defense Fleet', value: 2500000, pipelineId: pipeline.id, stageId: stage.id }
    });

    expect(result.lead.status).toBe('CONVERTED');
    expect(result.lead.convertedAt).not.toBeNull();
    expect(result.accountId).toBeDefined();
    expect(result.contactId).toBeDefined();
    expect(result.opportunityId).toBeDefined();

    // Verify persisted database models
    const dbAccount = await prismaTest.account.findUnique({ where: { id: result.accountId } });
    expect(dbAccount?.name).toBe('Wayne Enterprises Inc');
    expect(dbAccount?.organizationId).toBe(org.id);

    const dbContact = await prismaTest.contact.findUnique({ where: { id: result.contactId } });
    expect(dbContact?.email).toBe('bruce@wayneenterprises.com');
    expect(dbContact?.accountId).toBe(result.accountId);

    const dbOpp = await prismaTest.opportunity.findUnique({ where: { id: result.opportunityId! } });
    expect(dbOpp?.name).toBe('Batmobile Defense Fleet');
    expect(dbOpp?.value.toString()).toBe('2500000');

    // Verify AuditLog
    const audit = await prismaTest.auditLog.findFirst({ where: { organizationId: org.id, action: 'LEAD_CONVERTED' } });
    expect(audit).not.toBeNull();
  });

  it('should block double-conversion of an already converted lead (409 Conflict)', async () => {
    const lead = await createTestLead({ organizationId: org.id });

    // First conversion
    await leadsService.convertLead(org.id, user.id, lead.id);

    // Second conversion attempt
    await expect(leadsService.convertLead(org.id, user.id, lead.id)).rejects.toThrow('Lead has already been converted');
  });

  it('should rollback transaction completely if opportunity pipeline validation fails', async () => {
    const lead = await createTestLead({
      organizationId: org.id,
      firstName: 'Clark',
      lastName: 'Kent',
      email: 'clark@dailyplanet.com',
      company: 'Daily Planet'
    });

    const initialAccountsCount = await prismaTest.account.count({ where: { organizationId: org.id } });
    const initialContactsCount = await prismaTest.contact.count({ where: { organizationId: org.id } });

    // Attempt conversion with non-existent pipeline & stage IDs
    await expect(
      leadsService.convertLead(org.id, user.id, lead.id, {
        createOpportunity: true,
        opportunity: {
          name: 'Invalid Opp',
          pipelineId: '00000000-0000-0000-0000-000000000000',
          stageId: '00000000-0000-0000-0000-000000000000'
        }
      })
    ).rejects.toThrow();

    // Verify NO orphaned Account or Contact records were created
    const finalAccountsCount = await prismaTest.account.count({ where: { organizationId: org.id } });
    const finalContactsCount = await prismaTest.contact.count({ where: { organizationId: org.id } });

    expect(finalAccountsCount).toBe(initialAccountsCount);
    expect(finalContactsCount).toBe(initialContactsCount);

    // Verify Lead remains unconverted
    const dbLead = await prismaTest.lead.findUnique({ where: { id: lead.id } });
    expect(dbLead?.status).toBe('NEW');
    expect(dbLead?.convertedAt).toBeNull();
  });
});
