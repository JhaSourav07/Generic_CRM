import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Security Hardening & Protection Policies (security)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Helmet HTTP Security Headers', () => {
    it('should attach hardened security headers on all HTTP responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      // X-Content-Type-Options: nosniff
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      // X-Frame-Options: SAMEORIGIN
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      // X-DNS-Prefetch-Control: off
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });
  });

  describe('Rate Limiter Protection', () => {
    it('should enforce rate limits on auth endpoints when x-test-rate-limit is enabled', async () => {
      // The auth limiter allows 15 attempts per 60 seconds
      // Make 15 requests
      for (let i = 0; i < 15; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('x-test-rate-limit', 'true')
          .set('x-forwarded-for', '192.168.1.50')
          .send({ email: `ratelimit${i}@test.com`, password: 'WrongPassword123!' });

        expect(res.status).toBe(401);
        expect(res.headers['x-ratelimit-limit']).toBe('15');
      }

      // 16th request must trigger 429 RATE_LIMIT_EXCEEDED
      const blockedRes = await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'true')
        .set('x-forwarded-for', '192.168.1.50')
        .send({ email: 'blocked@test.com', password: 'WrongPassword123!' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(blockedRes.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('should allow unlimited requests in test environment when x-test-rate-limit is omitted', async () => {
      // Without x-test-rate-limit header, requests bypass rate limiter in test mode
      for (let i = 0; i < 18; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: `unlimited${i}@test.com`, password: 'WrongPassword123!' });

        expect(res.status).toBe(401);
      }
    });
  });

  describe('Last Admin Protection Rule', () => {
    it('should reject demoting the sole active administrator of an organization', async () => {
      const org = await createTestOrg({ name: 'Admin Safety Corp' });
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const salesRepRole = await createTestRole({ organizationId: org.id, name: 'SALES_REP' });

      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Sole Administrator',
        email: 'soleadmin@adminsafety.com',
        isActive: true
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      // Attempt to demote sole admin to SALES_REP
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}`)
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ roleId: salesRepRole.id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTION');
      expect(res.body.error.message).toContain('Cannot demote the last active administrator');
    });

    it('should reject deactivating the sole active administrator of an organization', async () => {
      const org = await createTestOrg({ name: 'Admin Safety Corp 2' });
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });

      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Sole Admin 2',
        email: 'soleadmin2@adminsafety.com',
        isActive: true
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      // Attempt to deactivate sole admin
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}/status`)
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTION');
      expect(res.body.error.message).toContain('Cannot deactivate the last active administrator');
    });

    it('should allow deactivating an admin when another active administrator exists', async () => {
      const org = await createTestOrg({ name: 'Dual Admin Corp' });
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });

      const adminUser1 = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Admin One',
        email: 'admin1@dual.com',
        isActive: true
      });

      // Create second admin
      await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Admin Two',
        email: 'admin2@dual.com',
        isActive: true
      });

      const token = authService.generateToken({
        userId: adminUser1.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser1.email
      });

      // Deactivate admin1 now that admin2 is active
      const res = await request(app)
        .patch(`/api/users/${adminUser1.id}/status`)
        .set('Cookie', [`vynexa_token=${token}`])
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('Database Error Sanitization', () => {
    it('should return sanitized error response when duplicate record is created within organization', async () => {
      const org = await createTestOrg({ name: 'Duplicate User Org' });
      const adminRole = await createTestRole({ organizationId: org.id, name: 'SUPER_ADMIN' });
      const adminUser = await createTestUser({
        organizationId: org.id,
        roleId: adminRole.id,
        name: 'Admin User',
        email: 'admin@dupuser.com'
      });

      const token = authService.generateToken({
        userId: adminUser.id,
        organizationId: org.id,
        roleId: adminRole.id,
        roleName: adminRole.name,
        email: adminUser.email
      });

      // Create a user
      const res1 = await request(app)
        .post('/api/users')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'First User',
          email: 'duplicate@test.com',
          password: 'Password123!',
          roleId: adminRole.id
        });
      expect(res1.status).toBe(201);

      // Attempt to create second user with same email in same org -> 409 DUPLICATE_EMAIL
      const res2 = await request(app)
        .post('/api/users')
        .set('Cookie', [`vynexa_token=${token}`])
        .send({
          name: 'Second User',
          email: 'duplicate@test.com',
          password: 'Password123!',
          roleId: adminRole.id
        });
      expect(res2.status).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error.code).toBe('DUPLICATE_EMAIL');

      // Verify no sensitive database traces leaked
      const errorBodyStr = JSON.stringify(res2.body);
      expect(errorBodyStr).not.toContain('prisma');
      expect(errorBodyStr).not.toContain('SELECT');
      expect(errorBodyStr).not.toContain('INSERT');
      expect(errorBodyStr).not.toContain('postgresql://');
    });

    it('should map raw Prisma error codes to clean, safe API errors via errorHandler', () => {
      import('../../src/middleware/errorHandler.js').then(({ errorHandler }) => {
        // Test P2002 -> 409 DUPLICATE_RECORD
        const mockResP2002: any = {
          statusCode: 0,
          body: null,
          status(code: number) { this.statusCode = code; return this; },
          json(data: any) { this.body = data; return this; }
        };
        const p2002Error: any = new Error('Unique constraint failed on the fields: (`sku`)');
        p2002Error.name = 'PrismaClientKnownRequestError';
        p2002Error.code = 'P2002';

        errorHandler(p2002Error, {} as any, mockResP2002, () => {});
        expect(mockResP2002.statusCode).toBe(409);
        expect(mockResP2002.body.error.code).toBe('DUPLICATE_RECORD');
        expect(mockResP2002.body.error.message).toBe('A record with this unique field already exists.');

        // Test P2003 -> 400 FOREIGN_KEY_VIOLATION
        const mockResP2003: any = {
          statusCode: 0,
          body: null,
          status(code: number) { this.statusCode = code; return this; },
          json(data: any) { this.body = data; return this; }
        };
        const p2003Error: any = new Error('Foreign key constraint failed');
        p2003Error.name = 'PrismaClientKnownRequestError';
        p2003Error.code = 'P2003';

        errorHandler(p2003Error, {} as any, mockResP2003, () => {});
        expect(mockResP2003.statusCode).toBe(400);
        expect(mockResP2003.body.error.code).toBe('FOREIGN_KEY_VIOLATION');

        // Test P2025 -> 404 NOT_FOUND
        const mockResP2025: any = {
          statusCode: 0,
          body: null,
          status(code: number) { this.statusCode = code; return this; },
          json(data: any) { this.body = data; return this; }
        };
        const p2025Error: any = new Error('Record to update not found.');
        p2025Error.name = 'PrismaClientKnownRequestError';
        p2025Error.code = 'P2025';

        errorHandler(p2025Error, {} as any, mockResP2025, () => {});
        expect(mockResP2025.statusCode).toBe(404);
        expect(mockResP2025.body.error.code).toBe('NOT_FOUND');
      });
    });
  });
});
