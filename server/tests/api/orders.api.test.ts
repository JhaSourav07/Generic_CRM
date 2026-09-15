import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { createTestProduct } from '../factories/product.factory.js';
import { createTestOrder } from '../factories/order.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';
import { OrderStatus } from '@prisma/client';

describe('Orders API Routes (/api/orders)', () => {
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
    account = await createTestAccount({ organizationId: org.id, name: 'Apex Corp' });

    authToken = authService.generateToken({
      userId: user.id,
      organizationId: org.id,
      roleId: superAdminRole.id,
      roleName: superAdminRole.name,
      email: user.email
    });
  });

  describe('GET /api/orders', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('should list orders with pagination', async () => {
      await createTestOrder({ organizationId: org.id, createdById: user.id, orderNumber: 'ORD-001' });
      await createTestOrder({ organizationId: org.id, createdById: user.id, orderNumber: 'ORD-002' });

      const res = await request(app)
        .get('/api/orders')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter orders by status', async () => {
      await createTestOrder({ organizationId: org.id, createdById: user.id, status: OrderStatus.CONFIRMED });
      await createTestOrder({ organizationId: org.id, createdById: user.id, status: OrderStatus.COMPLETED });

      const res = await request(app)
        .get('/api/orders?status=COMPLETED')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('COMPLETED');
    });
  });

  describe('POST /api/orders (Manual Creation)', () => {
    it('should create order and calculate totals server-side', async () => {
      const product = await createTestProduct({ organizationId: org.id, price: 1200 });

      const res = await request(app)
        .post('/api/orders')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          accountId: account.id,
          notes: 'Direct commercial contract',
          items: [
            {
              productId: product.id,
              description: 'Enterprise Workstation',
              quantity: 3,
              unitPrice: 1200,
              discount: 200,
              tax: 340
            }
          ]
        });

      expect(res.status).toBe(201);
      // 3 * 1200 = 3600 subtotal, discount 200, tax 340 -> total 3740
      expect(res.body.data.subtotal).toBe(3600);
      expect(res.body.data.discount).toBe(200);
      expect(res.body.data.tax).toBe(340);
      expect(res.body.data.total).toBe(3740);
      expect(res.body.data.status).toBe('PENDING');
    });
  });

  describe('Order Status Workflow Actions', () => {
    it('should transition PENDING -> CONFIRMED -> PROCESSING -> COMPLETED', async () => {
      const order = await createTestOrder({ organizationId: org.id, createdById: user.id, status: OrderStatus.PENDING });

      // 1. Confirm
      const resConfirm = await request(app)
        .post(`/api/orders/${order.id}/confirm`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(resConfirm.status).toBe(200);
      expect(resConfirm.body.data.status).toBe('CONFIRMED');

      // 2. Process
      const resProcess = await request(app)
        .post(`/api/orders/${order.id}/process`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(resProcess.status).toBe(200);
      expect(resProcess.body.data.status).toBe('PROCESSING');

      // 3. Complete
      const resComplete = await request(app)
        .post(`/api/orders/${order.id}/complete`)
        .set('Cookie', [`vynexa_token=${authToken}`]);
      expect(resComplete.status).toBe(200);
      expect(resComplete.body.data.status).toBe('COMPLETED');
    });

    it('should cancel an active order with a reason', async () => {
      const order = await createTestOrder({ organizationId: org.id, createdById: user.id, status: OrderStatus.PENDING });

      const res = await request(app)
        .post(`/api/orders/${order.id}/cancel`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ reason: 'Customer changed operational priorities' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should reject invalid status transitions (e.g. COMPLETED -> CANCELLED)', async () => {
      const completedOrder = await createTestOrder({ organizationId: org.id, createdById: user.id, status: OrderStatus.COMPLETED });

      const res = await request(app)
        .post(`/api/orders/${completedOrder.id}/cancel`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ reason: 'Attempt cancel completed' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_CANCEL_COMPLETED_ORDER');
    });
  });
});
