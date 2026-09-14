import { describe, it, expect, beforeEach } from 'vitest';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestLead } from '../factories/lead.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { opportunitiesService } from '../../src/modules/opportunities/opportunities.service.js';
import { leadsService } from '../../src/modules/leads/leads.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Opportunity Database Transactions, Precision & Concurrency (database)', () => {
  let org: any;
  let user: any;
  let pipeline: any;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    const role = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: role.id });
    pipeline = await createTestPipeline({ organizationId: org.id, isDefault: true });
  });

  describe('Financial Decimal Precision Tests', () => {
    it('should preserve exact precision for 1000.50 without floating point artifacts', async () => {
      const opp = await opportunitiesService.createOpportunity(org.id, user.id, {
        name: 'Precision Test 1',
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 1000.50
      });

      expect(opp.value).toBe(1000.50);

      const dbOpp = await prismaTest.opportunity.findUnique({ where: { id: opp.id } });
      expect(Number(dbOpp?.value)).toBe(1000.50);
    });

    it('should handle large monetary values up to 999,999,999.99', async () => {
      const opp = await opportunitiesService.createOpportunity(org.id, user.id, {
        name: 'Mega Enterprise Deal',
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 999999999.99
      });

      expect(opp.value).toBe(999999999.99);

      const dbOpp = await prismaTest.opportunity.findUnique({ where: { id: opp.id } });
      expect(Number(dbOpp?.value)).toBe(999999999.99);
    });

    it('should handle zero value opportunities', async () => {
      const opp = await opportunitiesService.createOpportunity(org.id, user.id, {
        name: 'Zero Value Deal',
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        value: 0
      });

      expect(opp.value).toBe(0);
    });
  });

  describe('Concurrency & State Transition Integrity', () => {
    it('should handle concurrent win and lose requests cleanly without impossible states', async () => {
      const opp = await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        status: 'OPEN'
      });

      // Fire simultaneous win and lose actions
      const results = await Promise.allSettled([
        opportunitiesService.winOpportunity(org.id, user.id, opp.id),
        opportunitiesService.loseOpportunity(org.id, user.id, opp.id, { reason: 'Lost to competitor' })
      ]);

      // Exactly one must succeed, the other rejected with ALREADY_WON or ALREADY_LOST
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      // Verify DB consistency
      const finalDbOpp = await prismaTest.opportunity.findUnique({ where: { id: opp.id } });
      expect(['WON', 'LOST']).toContain(finalDbOpp?.status);
      expect(finalDbOpp?.closedAt).not.toBeNull();
    });
  });

  describe('Lead Conversion Compatibility Regression', () => {
    it('should create an Opportunity during Lead conversion that appears in opportunity queries', async () => {
      const lead = await createTestLead({
        organizationId: org.id,
        ownerId: user.id,
        firstName: 'Dwight',
        lastName: 'Schrute',
        company: 'Schrute Farms Beet Co.'
      });

      const conversionResult = await leadsService.convertLead(org.id, user.id, lead.id, {
        createOpportunity: true,
        opportunity: {
          name: 'Schrute Farms Enterprise Supply',
          value: 45000,
          pipelineId: pipeline.id,
          stageId: pipeline.stages[0].id
        }
      });

      expect(conversionResult.lead.status).toBe('CONVERTED');

      // Verify opportunity exists in database
      const createdOpp = await prismaTest.opportunity.findFirst({
        where: {
          organizationId: org.id,
          name: 'Schrute Farms Enterprise Supply'
        },
        include: { account: true, stage: true }
      });

      expect(createdOpp).not.toBeNull();
      expect(Number(createdOpp?.value)).toBe(45000);
      expect(createdOpp?.accountId).toBe(conversionResult.lead.convertedAccountId);
      expect(createdOpp?.stageId).toBe(pipeline.stages[0].id);

      // Verify query via opportunitiesService lists the converted deal
      const list = await opportunitiesService.getOpportunities(org.id, { search: 'Schrute' });
      expect(list.opportunities.length).toBe(1);
      expect(list.opportunities[0].name).toBe('Schrute Farms Enterprise Supply');
    });
  });
});
