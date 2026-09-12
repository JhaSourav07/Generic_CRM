import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { clearTestDb, disconnectTestDb } from '../helpers/testDb.js';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('Authentication & Secrets Security (security)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('should return identical generic 401 error message for nonexistent email and wrong password to prevent email enumeration', async () => {
    // 1. Nonexistent email
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'Password123!' });

    // 2. Existing user with wrong password
    await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Security Corp',
        name: 'Sec User',
        email: 'existing@test.com',
        password: 'CorrectPassword123!',
        confirmPassword: 'CorrectPassword123!'
      });

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'existing@test.com', password: 'WrongPassword999!' });

    expect(res1.status).toBe(401);
    expect(res2.status).toBe(401);
    expect(res1.body.error.message).toBe('Invalid email or password');
    expect(res2.body.error.message).toBe('Invalid email or password');
  });

  it('should never expose passwordHash or secrets in user response envelopes', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Privacy Inc',
        name: 'Private User',
        email: 'privacy@test.com',
        password: 'SuperSecret123!',
        confirmPassword: 'SuperSecret123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('SuperSecret123!');
  });

  it('should safely escape SQL injection and Script injection payloads during signup', async () => {
    const maliciousPayload = {
      organizationName: "Org' OR '1'='1'; DROP TABLE users; --",
      name: "<script>alert('xss')</script>",
      email: "injection@test.com",
      password: "Password123!",
      confirmPassword: "Password123!"
    };

    const res = await request(app)
      .post('/api/auth/signup')
      .send(maliciousPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.user.name).toBe("<script>alert('xss')</script>");
    expect(res.body.data.user.organization.name).toContain("Org' OR '1'='1'");
  });
});
