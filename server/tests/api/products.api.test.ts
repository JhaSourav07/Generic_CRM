import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestProduct } from '../factories/product.factory.js';
import { createTestQuote } from '../factories/quote.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Products API Routes (/api/products)', () => {
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

  describe('GET /api/products', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
    });

    it('should return paginated products for authenticated organization', async () => {
      await createTestProduct({ organizationId: org.id, name: 'Cloud Hosting' });
      await createTestProduct({ organizationId: org.id, name: 'Managed Database' });

      const res = await request(app)
        .get('/api/products')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should search products by name, sku, or description', async () => {
      await createTestProduct({ organizationId: org.id, name: 'Enterprise Analytics Suite', sku: 'EAS-01' });
      await createTestProduct({ organizationId: org.id, name: 'Basic Support Pack', sku: 'BSP-02' });

      const res = await request(app)
        .get('/api/products?search=analytics')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Enterprise Analytics Suite');
    });

    it('should filter by product type and active status', async () => {
      await createTestProduct({ organizationId: org.id, name: 'P1', type: 'PRODUCT', isActive: true });
      await createTestProduct({ organizationId: org.id, name: 'S1', type: 'SERVICE', isActive: true });
      await createTestProduct({ organizationId: org.id, name: 'P2', type: 'PRODUCT', isActive: false });

      const res = await request(app)
        .get('/api/products?type=SERVICE&isActive=true')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('S1');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/products/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(404);
    });

    it('should return product detail with counts', async () => {
      const product = await createTestProduct({ organizationId: org.id, name: 'Consulting Hour', price: 150 });

      const res = await request(app)
        .get(`/api/products/${product.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(product.id);
      expect(res.body.data.price).toBe(150);
    });
  });

  describe('POST /api/products', () => {
    it('should validate inputs and reject negative price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          name: 'Invalid Product',
          price: -25
        });

      expect(res.status).toBe(400);
    });

    it('should create product successfully and create audit log', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          name: 'Premium Subscription',
          sku: 'PREM-SUB-01',
          type: 'PRODUCT',
          price: 299.99,
          currency: 'USD',
          isActive: true
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Premium Subscription');
      expect(res.body.data.sku).toBe('PREM-SUB-01');
      expect(res.body.data.price).toBe(299.99);

      // Verify DB audit log
      const audit = await prismaTest.auditLog.findFirst({
        where: { organizationId: org.id, entityId: res.body.data.id }
      });
      expect(audit).not.toBeNull();
      expect(audit?.action).toBe('CREATE');
    });

    it('should return 409 CONFLICT for duplicate SKU in same organization', async () => {
      await createTestProduct({ organizationId: org.id, sku: 'UNIQUE-SKU-99' });

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          name: 'Another Product',
          sku: 'UNIQUE-SKU-99',
          price: 50
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product details', async () => {
      const product = await createTestProduct({ organizationId: org.id, name: 'Original Name', price: 100 });

      const res = await request(app)
        .patch(`/api/products/${product.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({
          name: 'Updated Name',
          price: 125.50
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.price).toBe(125.50);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product when no historical quotes/orders exist', async () => {
      const product = await createTestProduct({ organizationId: org.id, name: 'Orphan Product' });

      const res = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });

    it('should deactivate product (isActive=false) when historical quote reference exists', async () => {
      const product = await createTestProduct({ organizationId: org.id, name: 'Quoted Product' });
      await createTestQuote({
        organizationId: org.id,
        createdById: user.id,
        items: [{ productId: product.id, description: 'Quoted line', quantity: 1, unitPrice: 100 }]
      });

      const res = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.deactivated).toBe(true);

      const dbProduct = await prismaTest.product.findUnique({ where: { id: product.id } });
      expect(dbProduct?.isActive).toBe(false);
    });
  });
});
