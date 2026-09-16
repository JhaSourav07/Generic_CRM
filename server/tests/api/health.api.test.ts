import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import * as prismaConfig from '../../src/config/prisma.js';

describe('App & Health Routes (API integration)', () => {
  it('should return status 200 and healthy status envelope on GET /api/health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.database).toBe('connected');
    expect(response.body.data.service).toBe('Vynexa CRM API Engine');
    expect(response.body.data.timestamp).toBeDefined();
  });

  it('should return status 503 degraded envelope when database is unreachable', async () => {
    const dbSpy = vi.spyOn(prismaConfig, 'checkDatabaseConnection').mockResolvedValue(false);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.data.status).toBe('degraded');
    expect(response.body.data.database).toBe('disconnected');
    expect(response.body.error.code).toBe('DATABASE_UNAVAILABLE');

    dbSpy.mockRestore();
  });

  it('should evaluate NODE_ENV fallback branch when NODE_ENV is empty', async () => {
    const originalEnv = process.env.NODE_ENV;
    delete (process.env as any).NODE_ENV;

    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data.environment).toBe('development');

    process.env.NODE_ENV = originalEnv;
  });

  it('should return 404 NOT_FOUND response envelope on unknown routes', async () => {
    const response = await request(app).get('/api/nonexistent-route-999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('The requested endpoint was not found on this server.');
  });
});
