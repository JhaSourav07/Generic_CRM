import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Pipeline Board API (/api/pipelines/:id/board) (Kanban backend aggregate)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;
  let pipeline: any;
  let account: any;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: superAdminRole.id });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: user.email
    });

    pipeline = await createTestPipeline({ organizationId: org.id, isDefault: true });
    account = await createTestAccount({ organizationId: org.id, name: 'Starlight Corp' });
  });

  it('should return board data with stages in database order and grouped opportunities', async () => {
    const stage0 = pipeline.stages[0]; // Qualification (0.2 prob)
    const stage1 = pipeline.stages[1]; // Value Proposal (0.4 prob)
    const stageWon = pipeline.stages[3]; // Closed Won (1.0 prob)

    // Stage 0 deal: 10,000, 0.2 prob -> weighted 2,000
    await createTestOpportunity({
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stage0.id,
      accountId: account.id,
      name: 'Deal A',
      value: 10000,
      probability: 0.2,
      status: 'OPEN'
    });

    // Stage 1 deal: 20,000, 0.5 prob -> weighted 10,000
    await createTestOpportunity({
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stage1.id,
      accountId: account.id,
      name: 'Deal B',
      value: 20000,
      probability: 0.5,
      status: 'OPEN'
    });

    // Won deal: 30,000
    await createTestOpportunity({
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: stageWon.id,
      accountId: account.id,
      name: 'Deal C Won',
      value: 30000,
      status: 'WON'
    });

    // Lost deal: 15,000
    await createTestOpportunity({
      organizationId: org.id,
      pipelineId: pipeline.id,
      stageId: pipeline.stages[4].id,
      accountId: account.id,
      name: 'Deal D Lost',
      value: 15000,
      status: 'LOST',
      lostReason: 'Price / Budget'
    });

    const res = await request(app)
      .get(`/api/pipelines/${pipeline.id}/board`)
      .set('Cookie', [`vynexa_token=${authToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.pipeline.id).toBe(pipeline.id);
    expect(data.stages.length).toBe(5);

    // Verify stage 0
    const returnedStage0 = data.stages.find((s: any) => s.id === stage0.id);
    expect(returnedStage0.opportunityCount).toBe(1);
    expect(returnedStage0.totalValue).toBe(10000);
    expect(returnedStage0.opportunities[0].name).toBe('Deal A');

    // Verify stage 1
    const returnedStage1 = data.stages.find((s: any) => s.id === stage1.id);
    expect(returnedStage1.opportunityCount).toBe(1);
    expect(returnedStage1.totalValue).toBe(20000);

    // Verify aggregates
    expect(data.totals.openCount).toBe(2);
    expect(data.totals.openValue).toBe(30000); // 10000 + 20000
    expect(data.totals.weightedValue).toBe(12000); // (10000*0.2) + (20000*0.5) = 2000 + 10000
    expect(data.totals.wonValue).toBe(30000);
    expect(data.totals.lostValue).toBe(15000);
  });

  it('should return empty stages with 0 totals when no opportunities exist', async () => {
    const res = await request(app)
      .get(`/api/pipelines/${pipeline.id}/board`)
      .set('Cookie', [`vynexa_token=${authToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.totals.openCount).toBe(0);
    expect(res.body.data.totals.openValue).toBe(0);
    expect(res.body.data.totals.weightedValue).toBe(0);
  });

  it('should handle board query when no pipelines exist for organization', async () => {
    const emptyOrg = await createTestOrg();
    const emptyRole = await createTestRole({ organizationId: emptyOrg.id, name: 'SUPER_ADMIN' });
    const emptyUser = await createTestUser({ organizationId: emptyOrg.id, roleId: emptyRole.id });

    const emptyToken = authService.generateToken({
      userId: emptyUser.id,
      organizationId: emptyOrg.id,
      roleId: emptyRole.id,
      roleName: emptyRole.name,
      email: emptyUser.email
    });

    const res = await request(app)
      .get('/api/pipelines/default/board')
      .set('Cookie', [`vynexa_token=${emptyToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.pipeline).toBeNull();
    expect(res.body.data.stages).toEqual([]);
    expect(res.body.data.totals.openCount).toBe(0);
  });
});
