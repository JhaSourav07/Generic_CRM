import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { env } from '../../src/config/env.js';

describe('AuthService (unit & database integration)', () => {
  let authService: AuthService;

  beforeEach(async () => {
    await clearTestDb();
    authService = new AuthService();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Password & Token Utilities', () => {
    it('should hash password with bcrypt and verify password successfully', async () => {
      const plain = 'SecretPassword123!';
      const hash = await authService.hashPassword(plain);

      expect(hash).not.toBe(plain);
      expect(await authService.comparePassword(plain, hash)).toBe(true);
      expect(await authService.comparePassword('WrongPassword', hash)).toBe(false);
    });

    it('should generate and verify valid JWT tokens', () => {
      const payload = {
        userId: 'u1',
        organizationId: 'o1',
        roleId: 'r1',
        roleName: 'SALES_MANAGER',
        email: 'test@vynexa.com'
      };

      const token = authService.generateToken(payload);
      expect(token).toBeDefined();

      const decoded = authService.verifyToken(token);
      expect(decoded.userId).toBe('u1');
      expect(decoded.organizationId).toBe('o1');
      expect(decoded.roleName).toBe('SALES_MANAGER');
    });

    it('should throw 401 UNAUTHORIZED error when verifying invalid token', () => {
      expect(() => authService.verifyToken('invalid.token.string')).toThrowError();
    });

    it('should sanitize raw user model and exclude sensitive fields', () => {
      const rawUser = {
        id: 'u1',
        name: 'Alex Vance',
        email: 'alex@acme.com',
        passwordHash: 'secret-bcrypt-hash',
        avatar: null,
        organizationId: 'org1',
        organization: { id: 'org1', name: 'Acme', slug: 'acme', currency: 'USD' },
        role: { id: 'role1', name: 'SALES_MANAGER', description: 'Admin' }
      };

      const sanitized = authService.sanitizeUser(rawUser);
      expect(sanitized.id).toBe('u1');
      expect(sanitized.email).toBe('alex@acme.com');
      expect((sanitized as any).passwordHash).toBeUndefined();
    });
  });

  describe('signup()', () => {
    it('should transactionally create Organization, User, Role, and Default Pipeline with 5 stages', async () => {
      const input = {
        organizationName: 'Acme Corporation',
        name: 'Alex Vance',
        email: 'alex.vance@acme.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = await authService.signup(input);

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('alex.vance@acme.com');
      expect(result.user.organization.name).toBe('Acme Corporation');
      expect(result.user.organization.slug).toBe('acme-corporation');
      expect(result.user.role.name).toBe('SALES_MANAGER');

      // Verify default pipeline created in DB
      const defaultPipeline = await prismaTest.pipeline.findFirst({
        where: { organizationId: result.user.organizationId },
        include: { stages: { orderBy: { order: 'asc' } } }
      });

      expect(defaultPipeline).toBeDefined();
      expect(defaultPipeline?.isDefault).toBe(true);
      expect(defaultPipeline?.stages.length).toBe(5);
      expect(defaultPipeline?.stages.map(s => s.name)).toEqual([
        'Qualification',
        'Value Proposal',
        'Negotiation',
        'Closed Won',
        'Closed Lost'
      ]);
    });

    it('should assign SUPER_ADMIN role if signup email matches ADMIN_EMAIL', async () => {
      const input = {
        organizationName: 'Super Admin Org',
        name: 'Super Admin User',
        email: env.ADMIN_EMAIL,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = await authService.signup(input);
      expect(result.user.role.name).toBe('SUPER_ADMIN');
    });

    it('should generate a unique organization slug if base slug already exists', async () => {
      await createTestOrg({ name: 'Acme Corporation', slug: 'acme-corporation' });

      const input = {
        organizationName: 'Acme Corporation',
        name: 'Alex Vance II',
        email: 'alex.vance2@acme.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = await authService.signup(input);
      expect(result.user.organization.slug).toMatch(/^acme-corporation-[a-z0-9]+$/);
    });

    it('should fallback baseSlug to "org" if organizationName contains only special symbols', async () => {
      const input = {
        organizationName: '!!!',
        name: 'Symbol User',
        email: 'symbol@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const result = await authService.signup(input);
      expect(result.user.organization.slug).toContain('org');
    });
  });

  describe('login()', () => {
    it('should authenticate valid credentials and return signed token and user', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id });
      const user = await createTestUser({
        organizationId: org.id,
        roleId: role.id,
        email: 'login.test@vynexa.com',
        password: 'ValidPassword123!'
      });

      const result = await authService.login({
        email: 'LOGIN.TEST@VYNEXA.COM', // Test case insensitivity
        password: 'ValidPassword123!'
      });

      expect(result.token).toBeDefined();
      expect(result.user.id).toBe(user.id);

      // Check lastLoginAt timestamp updated
      const updatedUser = await prismaTest.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.lastLoginAt).not.toBeNull();
    });

    it('should throw generic 401 error when password is incorrect', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id });
      await createTestUser({
        organizationId: org.id,
        roleId: role.id,
        email: 'wrongpass@test.com',
        password: 'CorrectPassword123!'
      });

      await expect(
        authService.login({
          email: 'wrongpass@test.com',
          password: 'WrongPassword999!'
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw generic 401 error when email does not exist', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@test.com',
          password: 'SomePassword123!'
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw 401 error when account is inactive', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id });
      await createTestUser({
        organizationId: org.id,
        roleId: role.id,
        email: 'inactive@test.com',
        password: 'Password123!',
        isActive: false
      });

      await expect(
        authService.login({
          email: 'inactive@test.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Your account has been deactivated');
    });
  });

  describe('getMe()', () => {
    it('should return sanitized profile for an active user', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });

      const profile = await authService.getMe(user.id);
      expect(profile.id).toBe(user.id);
      expect(profile.organization.id).toBe(org.id);
    });

    it('should throw 401 if user does not exist or is inactive', async () => {
      await expect(authService.getMe('non-existent-uuid')).rejects.toThrow('Authenticated user session not found');
    });
  });
});
