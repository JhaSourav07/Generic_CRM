import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestProduct } from '../factories/product.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, prismaTest } from '../helpers/testDb.js';

describe('Products Security & Multi-Tenancy (security)', () => {
  let orgA: any;
  let userA: any;
  let tokenA: string;
  let productA: any;

  let orgB: any;
  let userB: any;
  let tokenB: string;
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
    productA = await createTestProduct({ organizationId: orgA.id, name: 'Org A Secret Product' });

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
    productB = await createTestProduct({ organizationId: orgB.id, name: 'Org B Proprietary Software' });
  });

  describe('IDOR & Cross-Tenant Access', () => {
    it('should block Org A from reading Org B product via GET /api/products/:id', async () => {
      const res = await request(app)
        .get(`/api/products/${productB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });

    it('should block Org A from updating Org B product via PATCH /api/products/:id', async () => {
      const res = await request(app)
        .patch(`/api/products/${productB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({ name: 'Tampered Name' });

      expect(res.status).toBe(404);

      // Verify unmutated in DB
      const dbProduct = await prismaTest.product.findUnique({ where: { id: productB.id } });
      expect(dbProduct?.name).toBe('Org B Proprietary Software');
    });

    it('should block Org A from deleting Org B product via DELETE /api/products/:id', async () => {
      const res = await request(app)
        .delete(`/api/products/${productB.id}`)
        .set('Cookie', [`vynexa_token=${tokenA}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('Mass Assignment & Tampering Prevention', () => {
    it('should ignore client-provided organizationId during product creation and bind to authenticated org', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [`vynexa_token=${tokenA}`])
        .send({
          name: 'Spoofed Org Product',
          organizationId: orgB.id, // Malicious injection
          price: 99
        });

      expect(res.status).toBe(201);
      expect(res.body.data.organizationId).toBe(orgA.id);

      const dbProduct = await prismaTest.product.findUnique({ where: { id: res.body.data.id } });
      expect(dbProduct?.organizationId).toBe(orgA.id);
    });
  });
});
