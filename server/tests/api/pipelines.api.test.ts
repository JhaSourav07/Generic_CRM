import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Pipeline & Stage API Routes (/api/pipelines) (API integration)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;

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
  });

  describe('GET /api/pipelines', () => {
    it('should list organization pipelines with ordered stages', async () => {
      await createTestPipeline({ organizationId: org.id, name: 'Primary Pipeline', isDefault: true });
      await createTestPipeline({ organizationId: org.id, name: 'Enterprise Pipeline', isDefault: false });

      const res = await request(app)
        .get('/api/pipelines')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].stages.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/pipelines', () => {
    it('should create new pipeline with default stages', async () => {
      const payload = {
        name: 'SMB Sales Pipeline',
        description: 'Targeted pipeline for fast-turnaround deals',
        isDefault: true
      };

      const res = await request(app)
        .post('/api/pipelines')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('SMB Sales Pipeline');
      expect(res.body.data.isDefault).toBe(true);
      expect(res.body.data.stages.length).toBe(5);
    });
  });

  describe('PATCH /api/pipelines/:id', () => {
    it('should update pipeline metadata', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id, name: 'Original Name' });

      const res = await request(app)
        .patch(`/api/pipelines/${pipeline.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ name: 'Renamed Pipeline', description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Renamed Pipeline');
    });
  });

  describe('DELETE /api/pipelines/:id safety checks', () => {
    it('should safely delete pipeline without opportunities', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id, name: 'Empty Pipeline' });

      const res = await request(app)
        .delete(`/api/pipelines/${pipeline.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbPipeline = await prismaTest.pipeline.findUnique({ where: { id: pipeline.id } });
      expect(dbPipeline).toBeNull();
    });

    it('should reject deleting pipeline containing active opportunities', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id, name: 'Active Pipeline' });
      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id
      });

      const res = await request(app)
        .delete(`/api/pipelines/${pipeline.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('contains active opportunities');
    });
  });

  describe('Stage management: POST /api/pipelines/:id/stages and DELETE /api/pipeline-stages/:id', () => {
    it('should create new stage in pipeline', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });

      const res = await request(app)
        .post(`/api/pipelines/${pipeline.id}/stages`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ name: 'Security Review', order: 6, probability: 0.85 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Security Review');
      expect(res.body.data.order).toBe(6);
    });

    it('should get pipeline by id', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id, name: 'Single Pipeline' });

      const res = await request(app)
        .get(`/api/pipelines/${pipeline.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Single Pipeline');
    });

    it('should update stage details', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });
      const stage = pipeline.stages[0];

      const res = await request(app)
        .patch(`/api/pipeline-stages/${stage.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ name: 'Initial Scoping', probability: 0.25, color: '#10B981' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Initial Scoping');
      expect(res.body.data.probability).toBe(0.25);
    });

    it('should reorder pipeline stages', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });
      const [stage0, stage1] = pipeline.stages;

      const res = await request(app)
        .patch(`/api/pipelines/${pipeline.id}/stages/reorder`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          stages: [
            { id: stage0.id, order: 2 },
            { id: stage1.id, order: 1 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should safely delete stage without opportunities', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });
      const stage = pipeline.stages[pipeline.stages.length - 1];

      const res = await request(app)
        .delete(`/api/pipeline-stages/${stage.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject deleting stage with active opportunities', async () => {
      const pipeline = await createTestPipeline({ organizationId: org.id });
      const stage = pipeline.stages[0];

      await createTestOpportunity({
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: stage.id
      });

      const res = await request(app)
        .delete(`/api/pipeline-stages/${stage.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('contains opportunities and cannot be deleted');
    });
  });
});
