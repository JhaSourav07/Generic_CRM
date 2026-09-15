import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestDocument } from '../factories/document.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Documents Security & Multi-Tenancy (security)', () => {
  let orgA: any;
  let orgB: any;
  let roleA: any;
  let roleB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await clearTestDb();

    // Org A setup
    orgA = await createTestOrg({ name: 'Organization A', slug: 'org-a' });
    roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'admin@orga.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });

    // Org B setup
    orgB = await createTestOrg({ name: 'Organization B', slug: 'org-b' });
    roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'admin@orgb.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
  });

  describe('IDOR & Cross-Tenant Document Access', () => {
    it('should block Org A from reading Org B document metadata via GET /api/documents/:id', async () => {
      const docB = await createTestDocument({
        organizationId: orgB.id,
        uploadedById: userB.id,
        name: 'Confidential Org B Roadmap'
      });

      const res = await request(app)
        .get(`/api/documents/${docB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should block Org A from downloading Org B document file via GET /api/documents/:id/download', async () => {
      const docB = await createTestDocument({
        organizationId: orgB.id,
        uploadedById: userB.id,
        name: 'Org B Proprietary Doc'
      });

      const res = await request(app)
        .get(`/api/documents/${docB.id}/download`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should block Org A from deleting Org B document via DELETE /api/documents/:id', async () => {
      const docB = await createTestDocument({
        organizationId: orgB.id,
        uploadedById: userB.id,
        name: 'Org B Secret'
      });

      const res = await request(app)
        .delete(`/api/documents/${docB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Cross-Tenant Relational Linking Attacks', () => {
    it('should reject document upload when referencing an Account belonging to Org B', async () => {
      const accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Client' });

      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .field('name', 'Malicious Link Doc')
        .field('accountId', accountB.id)
        .attach('file', Buffer.from('%PDF-1.4 attack payload'), 'doc.pdf');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject document upload when referencing an Opportunity belonging to Org B', async () => {
      const pipelineB = await createTestPipeline({ organizationId: orgB.id });
      const oppB = await createTestOpportunity({
        organizationId: orgB.id,
        pipelineId: pipelineB.id,
        stageId: pipelineB.stages[0].id,
        name: 'Org B Deal'
      });

      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .field('name', 'Malicious Deal Link Doc')
        .field('opportunityId', oppB.id)
        .attach('file', Buffer.from('%PDF-1.4 attack deal payload'), 'opp_doc.pdf');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Mass Assignment & Path Traversal Prevention', () => {
    it('should reject path traversal in uploaded document name', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .field('name', '../../../etc/passwd')
        .attach('file', Buffer.from('%PDF-1.4 harmless'), 'harmless.pdf');

      expect(res.status).toBe(400);
    });
  });
});
