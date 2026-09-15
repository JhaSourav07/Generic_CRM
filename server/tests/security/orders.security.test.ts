import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { createTestOrder } from '../factories/order.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';
import { OrderStatus, QuoteStatus } from '@prisma/client';

describe('Orders Security, IDOR & Multi-Tenancy Attacks (security)', () => {
  let orgA: any;
  let userA: any;
  let tokenA: string;
  let orderA: any;

  let orgB: any;
  let userB: any;
  let tokenB: string;
  let orderB: any;
  let quoteB: any;
  let accountB: any;

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
    orderA = await createTestOrder({ organizationId: orgA.id, createdById: userA.id });

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
    accountB = await createTestAccount({ organizationId: orgB.id, name: 'Org B Customer' });
    quoteB = await createTestQuote({ organizationId: orgB.id, createdById: userB.id, status: QuoteStatus.APPROVED });
    orderB = await createTestOrder({ organizationId: orgB.id, createdById: userB.id, quoteId: quoteB.id, status: OrderStatus.PENDING });
  });

  describe('IDOR & Cross-Tenant Access', () => {
    it('should block Org A from reading Org B order via GET', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A from confirming Org B order via POST /api/orders/:id/confirm', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderB.id}/confirm`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A from cancelling Org B order via POST /api/orders/:id/cancel', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderB.id}/cancel`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ reason: 'Malicious cancellation' });

      expect(res.status).toBe(404);
    });
  });

  describe('Cross-Tenant Relational Linking Attacks', () => {
    it('should block Org A Order from linking to Org B Customer Account', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          accountId: accountB.id,
          items: [{ description: 'Item', quantity: 1, unitPrice: 100 }]
        });

      expect(res.status).toBe(404);
    });

    it('should block Org A Order from linking to Org B Quote', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          quoteId: quoteB.id,
          items: [{ description: 'Item', quantity: 1, unitPrice: 100 }]
        });

      expect(res.status).toBe(404);
    });
  });

  describe('Mass Assignment Protection', () => {
    it('should ignore spoofed organizationId in request body and bind order to current tenant', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          organizationId: orgB.id, // Malicious spoof
          items: [{ description: 'Direct Order', quantity: 1, unitPrice: 50 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.organizationId).toBe(orgA.id);

      const dbOrder = await prismaTest.order.findUnique({ where: { id: res.body.data.id } });
      expect(dbOrder?.organizationId).toBe(orgA.id);
    });
  });
});
