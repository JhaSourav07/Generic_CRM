import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestOpportunity } from '../factories/opportunity.factory.js';
import { createTestPipeline } from '../factories/pipeline.factory.js';
import { createTestProduct } from '../factories/product.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';
import { QuoteStatus } from '@prisma/client';

describe('Quotes Security, IDOR & Tampering Protection (security)', () => {
  let orgA: any;
  let userA: any;
  let tokenA: string;
  let quoteA: any;
  let productA: any;

  let orgB: any;
  let userB: any;
  let tokenB: string;
  let quoteB: any;
  let accountB: any;
  let oppB: any;
  let productB: any;

  beforeEach(async () => {
    await clearTestDb();

    // Setup Org A
    orgA = await createTestOrg();
    const roleA = await createTestRole({ organizationId: orgA.id, name: 'SUPER_ADMIN' });
    userA = await createTestUser({ organizationId: orgA.id, roleId: roleA.id, email: 'admin@orga.com' });
    tokenA = authService.generateToken({
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleName: roleA.name,
      email: userA.email
    });
    productA = await createTestProduct({ organizationId: orgA.id, price: 100 });
    quoteA = await createTestQuote({ organizationId: orgA.id, createdById: userA.id });

    // Setup Org B
    orgB = await createTestOrg();
    const roleB = await createTestRole({ organizationId: orgB.id, name: 'SUPER_ADMIN' });
    userB = await createTestUser({ organizationId: orgB.id, roleId: roleB.id, email: 'admin@orgb.com' });
    tokenB = authService.generateToken({
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleName: roleB.name,
      email: userB.email
    });
    accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Confidential Account' });
    const pipelineB = await createTestPipeline({ organizationId: orgB.id });
    oppB = await createTestOpportunity({
      organizationId: orgB.id,
      pipelineId: pipelineB.id,
      stageId: pipelineB.stages[0].id
    });
    productB = await createTestProduct({ organizationId: orgB.id, price: 500 });
    quoteB = await createTestQuote({ organizationId: orgB.id, createdById: userB.id, status: QuoteStatus.APPROVED });
  });

  describe('Cross-Tenant IDOR Attacks', () => {
    it('should block Org A from reading Org B quote', async () => {
      const res = await request(app)
        .get(`/api/quotes/${quoteB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A from updating Org B quote', async () => {
      const res = await request(app)
        .patch(`/api/quotes/${quoteB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ notes: 'Hacked by Org A' });

      expect(res.status).toBe(404);
    });

    it('should block Org A from converting Org B quote to an order', async () => {
      const res = await request(app)
        .post(`/api/quotes/${quoteB.id}/convert-to-order`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('Cross-Tenant Relation Linking Attacks', () => {
    it('should block Org A Quote from linking to Org B Customer Account', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          accountId: accountB.id, // Org B account
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }]
        });

      expect(res.status).toBe(404);
    });

    it('should block Org A Quote from linking to Org B Opportunity', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          opportunityId: oppB.id, // Org B opportunity
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }]
        });

      expect(res.status).toBe(404);
    });

    it('should block Org A Quote from linking to Org B Product', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          items: [{ productId: productB.id, description: 'Test line', quantity: 1 }]
        });

      expect(res.status).toBe(404);
    });
  });

  describe('Financial Totals Tampering Prevention', () => {
    it('should ignore client total tampering and enforce server arithmetic', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          total: 0.01, // Client attempting to buy for 1 cent
          subtotal: 0.01,
          discount: 999999,
          items: [
            {
              description: 'Server Authority Item',
              quantity: 5,
              unitPrice: 200,
              discount: 50,
              tax: 15
            }
          ]
        });

      expect(res.status).toBe(201);
      // 5 * 200 = 1000 subtotal, discount 50, tax 15 -> total 965
      expect(res.body.data.subtotal).toBe(1000);
      expect(res.body.data.discount).toBe(50);
      expect(res.body.data.tax).toBe(15);
      expect(res.body.data.total).toBe(965);

      const dbQuote = await prismaTest.quote.findUnique({ where: { id: res.body.data.id } });
      expect(Number(dbQuote?.total)).toBe(965);
    });
  });

  describe('RBAC Approval Verification', () => {
    it('should reject quote approval if user lacks APPROVE permission', async () => {
      // Role with only VIEW and CREATE permissions on quotes
      const salesRepRole = await createTestRole({ organizationId: orgA.id, name: 'SALES_REP_RESTRICTED' });
      const viewPerm = await prismaTest.permission.findFirst({ where: { resource: 'quotes', action: 'VIEW' } });
      if (viewPerm) {
        await prismaTest.rolePermission.create({
          data: { roleId: salesRepRole.id, permissionId: viewPerm.id }
        });
      }

      const restrictedUser = await createTestUser({
        organizationId: orgA.id,
        roleId: salesRepRole.id,
        email: 'rep@orga.com'
      });

      const restrictedToken = authService.generateToken({
        userId: restrictedUser.id,
        organizationId: orgA.id,
        roleId: salesRepRole.id,
        roleName: salesRepRole.name,
        email: restrictedUser.email
      });

      const res = await request(app)
        .post(`/api/quotes/${quoteA.id}/approve`)
        .set('Cookie', [`vynexa_token=${restrictedToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
