import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { createTestAccount } from '../factories/account.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb } from '../helpers/testDb.js';

describe('Customers & Accounts API Routes (/api/customers) (API integration)', () => {
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

  describe('GET /api/customers', () => {
    it('should return 401 UNAUTHORIZED when no auth token provided', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
    });

    it('should list customer accounts with pagination metadata', async () => {
      await createTestAccount({ organizationId: org.id, name: 'Customer A' });
      await createTestAccount({ organizationId: org.id, name: 'Customer B' });

      const res = await request(app)
        .get('/api/customers')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer account successfully', async () => {
      const payload = {
        name: 'Cyberdyne Systems',
        industry: 'Defense Technologies',
        email: 'contact@cyberdyne.com',
        status: 'active'
      };

      const res = await request(app)
        .post('/api/customers')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Cyberdyne Systems');
    });

    it('should return 400 VALIDATION_ERROR on missing required account name', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Cookie', [`vynexa_token=${authToken}`])
        .send({ industry: 'Aerospace' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer details by ID', async () => {
      const account = await createTestAccount({ organizationId: org.id, name: 'Wayne Enterprises' });

      const res = await request(app)
        .get(`/api/customers/${account.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Wayne Enterprises');
    });

    it('should return 404 NOT_FOUND for non-existent customer ID', async () => {
      const res = await request(app)
        .get('/api/customers/00000000-0000-0000-0000-000000000000')
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should soft delete customer account', async () => {
      const account = await createTestAccount({ organizationId: org.id });

      const res = await request(app)
        .delete(`/api/customers/${account.id}`)
        .set('Cookie', [`vynexa_token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
