import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb } from '../helpers/testDb.js';

describe('Auth API Routes (/api/auth) (API integration)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/auth/signup', () => {
    it('should register new organization and admin user, setting HttpOnly cookie', async () => {
      const payload = {
        organizationName: 'Stark Industries',
        name: 'Tony Stark',
        email: 'tony@stark.com',
        password: 'IronManPassword123!',
        confirmPassword: 'IronManPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('tony@stark.com');
      expect(response.body.data.user.organization.name).toBe('Stark Industries');

      // Verify HttpOnly cookie header
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('vynexa_token=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should return 400 VALIDATION_ERROR on malformed request body', async () => {
      const payload = {
        organizationName: 'S',
        name: '',
        email: 'invalid-email',
        password: 'short',
        confirmPassword: 'mismatch'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user, returning 200 OK and setting session cookie', async () => {
      // 1. Create user via signup endpoint
      await request(app)
        .post('/api/auth/signup')
        .send({
          organizationName: 'Wayne Enterprises',
          name: 'Bruce Wayne',
          email: 'bruce@wayne.com',
          password: 'BatmanPassword123!',
          confirmPassword: 'BatmanPassword123!'
        });

      // 2. Perform login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bruce@wayne.com',
          password: 'BatmanPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Bruce Wayne');

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies[0]).toContain('vynexa_token=');
    });

    it('should return 401 UNAUTHORIZED on invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bruce@wayne.com',
          password: 'WrongPassword999!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current authenticated user when valid HttpOnly cookie is provided', async () => {
      // 1. Signup to receive cookie
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          organizationName: 'Oscorp',
          name: 'Norman Osborn',
          email: 'norman@oscorp.com',
          password: 'GoblinPassword123!',
          confirmPassword: 'GoblinPassword123!'
        });

      const cookie = signupRes.headers['set-cookie'];

      // 2. Fetch /api/auth/me using cookie
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.email).toBe('norman@oscorp.com');
      expect(meRes.body.data.user.organization.name).toBe('Oscorp');
    });

    it('should return 401 UNAUTHORIZED when no auth cookie is attached', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear authentication cookie and return 200 OK', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies[0]).toContain('vynexa_token=;');
    });
  });
});
