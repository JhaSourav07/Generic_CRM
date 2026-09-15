import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestProduct } from '../factories/product.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';
import { QuoteStatus } from '@prisma/client';

describe('Quotes API Routes (/api/quotes)', () => {
  let org: any;
  let superAdminRole: any;
  let user: any;
  let authToken: string;
  let account: any;

  beforeEach(async () => {
    await clearTestDb();

    org = await createTestOrg();
    superAdminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
    user = await createTestUser({ organizationId: org.id, roleId: superAdminRole.id });
    account = await createTestAccount({ organizationId: org.id, name: 'Acme Client' });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: user.email
    });
  });

  describe('GET /api/quotes', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/quotes');
      expect(res.status).toBe(401);
    });

    it('should list quotes with pagination metadata', async () => {
      await createTestQuote({ organizationId: org.id, createdById: user.id, quoteNumber: 'QT-001' });
      await createTestQuote({ organizationId: org.id, createdById: user.id, quoteNumber: 'QT-002' });

      const res = await request(app)
        .get('/api/quotes')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter quotes by status', async () => {
      await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.DRAFT });
      await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.APPROVED });

      const res = await request(app)
        .get('/api/quotes?status=APPROVED')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('APPROVED');
    });
  });

  describe('POST /api/quotes', () => {
    it('should calculate authoritative totals server-side and override client fake numbers', async () => {
      const product = await createTestProduct({ organizationId: org.id, price: 25000 });

      // Client attempts to send fake/tampered totals
      const res = await request(app)
        .post('/api/quotes')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          accountId: account.id,
          total: 1.00, // Maliciously low client total
          subtotal: 5.00,
          discount: 0,
          tax: 0,
          items: [
            {
              productId: product.id,
              description: 'Enterprise Deployment',
              quantity: 2,
              unitPrice: 25000,
              discount: 5000,
              tax: 8100
            }
          ]
        });

      expect(res.status).toBe(201);
      // Server calculates: 2 * 25000 = 50000, discount 5000, tax 8100 -> total 53100
      expect(res.body.data.subtotal).toBe(50000);
      expect(res.body.data.discount).toBe(5000);
      expect(res.body.data.tax).toBe(8100);
      expect(res.body.data.total).toBe(53100);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('should reject quote creation if product is inactive', async () => {
      const inactiveProduct = await createTestProduct({ organizationId: org.id, isActive: false });

      const res = await request(app)
        .post('/api/quotes')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          accountId: account.id,
          items: [
            {
              productId: inactiveProduct.id,
              description: 'Inactive Product Order',
              quantity: 1
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PRODUCT_INACTIVE');
    });
  });

  describe('Quote Status Lifecycle & Actions', () => {
    it('should transition DRAFT -> SENT via /send', async () => {
      const quote = await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.DRAFT });

      const res = await request(app)
        .post(`/api/quotes/${quote.id}/send`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SENT');
      expect(res.body.message).toBe('Quote marked as sent.');
    });

    it('should approve quote via /approve and reject approving an expired quote', async () => {
      // 1. Valid quote approval
      const quote = await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.SENT });

      const res = await request(app)
        .post(`/api/quotes/${quote.id}/approve`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');

      // 2. Expired quote approval attempt
      const expiredQuote = await createTestQuote({
        organizationId: org.id,
        createdById: user.id,
        status: QuoteStatus.SENT,
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      const expRes = await request(app)
        .post(`/api/quotes/${expiredQuote.id}/approve`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(expRes.status).toBe(400);
      expect(expRes.body.error.code).toBe('QUOTE_EXPIRED');
    });

    it('should enforce immutability on APPROVED quotes', async () => {
      const quote = await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.APPROVED });

      const res = await request(app)
        .patch(`/api/quotes/${quote.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          items: [
            {
              description: 'Illegal modification',
              quantity: 1,
              unitPrice: 10
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('QUOTE_IMMUTABLE');
    });

    it('should reject deleting an APPROVED quote', async () => {
      const quote = await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.APPROVED });

      const res = await request(app)
        .delete(`/api/quotes/${quote.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_APPROVED_QUOTE');
    });
  });

  describe('Quote to Order Conversion (POST /api/quotes/:id/convert-to-order)', () => {
    it('should convert approved quote to order and preserve historical approved pricing', async () => {
      const product = await createTestProduct({ organizationId: org.id, price: 30000 }); // Price increased later

      // Quote was approved at 25,000
      const quote = await createTestQuote({
        organizationId: org.id,
        createdById: user.id,
        accountId: account.id,
        status: QuoteStatus.APPROVED,
        subtotal: 50000,
        discount: 5000,
        tax: 8100,
        total: 53100,
        items: [
          {
            productId: product.id,
            description: 'Approved Consulting Service',
            quantity: 2,
            unitPrice: 25000,
            discount: 5000,
            tax: 8100,
            total: 53100
          }
        ]
      });

      const res = await request(app)
        .post(`/api/quotes/${quote.id}/convert-to-order`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quoteId).toBe(quote.id);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.subtotal).toBe(50000);
      expect(res.body.data.total).toBe(53100);
      expect(res.body.data.items[0].unitPrice).toBe(25000); // Preserved historical quote price, NOT current product price (30000)

      // Verify DB Order and OrderItems
      const dbOrder = await prismaTest.order.findUnique({
        where: { id: res.body.data.id },
        include: { items: true }
      });
      expect(dbOrder).not.toBeNull();
      expect(dbOrder?.items.length).toBe(1);
      expect(Number(dbOrder?.items[0].unitPrice)).toBe(25000);
    });

    it('should return 409 CONFLICT if quote is converted twice (Double Conversion Protection)', async () => {
      const quote = await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.APPROVED });

      // First conversion succeeds
      const res1 = await request(app)
        .post(`/api/quotes/${quote.id}/convert-to-order`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(res1.status).toBe(201);

      // Second conversion returns 409 Conflict
      const res2 = await request(app)
        .post(`/api/quotes/${quote.id}/convert-to-order`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('ALREADY_CONVERTED');
    });

    it('should reject conversion if quote is not APPROVED', async () => {
      const draftQuote = await createTestQuote({ organizationId: org.id, createdById: user.id, status: QuoteStatus.DRAFT });

      const res = await request(app)
        .post(`/api/quotes/${draftQuote.id}/convert-to-order`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('QUOTE_NOT_APPROVED');
    });
  });
});
