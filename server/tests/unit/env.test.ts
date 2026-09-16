import { describe, it, expect, vi } from 'vitest';
import { env, parseEnv, envSchema } from '../../src/config/env.js';

describe('Environment Configuration (unit)', () => {
  it('should correctly parse and export validated runtime environment variables', () => {
    expect(env).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.NODE_ENV).toBe('test');
    expect(env.CLIENT_URL).toBeDefined();
    expect(env.AUTH_SECRET).toBeDefined();
    expect(env.ADMIN_EMAIL).toContain('@');
  });

  it('should handle invalid environment configurations during schema parsing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    parseEnv({ ADMIN_EMAIL: 'not-an-email' });

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should reject insecure defaults when NODE_ENV is production', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    // Attempting production with dev defaults
    parseEnv({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://crm.vynexa.com',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/vynexa_crm?schema=public',
      AUTH_SECRET: 'vynexa-crm-super-secret-key-change-in-production'
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should validate and parse valid production environment configuration', () => {
    const validProd = envSchema.safeParse({
      NODE_ENV: 'production',
      PORT: '5000',
      CLIENT_URL: 'https://crm.vynexa.com',
      DATABASE_URL: 'postgresql://cloud_user:securepassword@db.vynexa.internal:5432/vynexa_prod?schema=public',
      AUTH_SECRET: 'production-secret-with-more-than-32-characters-entropy',
      ADMIN_EMAIL: 'ops@vynexa.com',
      ADMIN_PASSWORD: 'custom-hardened-admin-password-1234'
    });

    expect(validProd.success).toBe(true);
    if (validProd.success) {
      expect(validProd.data.PORT).toBe(5000);
      expect(validProd.data.NODE_ENV).toBe('production');
      expect(validProd.data.CLIENT_URL).toBe('https://crm.vynexa.com');
    }
  });

  it('should reject invalid URL format for CLIENT_URL', () => {
    const res = envSchema.safeParse({
      CLIENT_URL: 'not-a-valid-url'
    });
    expect(res.success).toBe(false);
  });

  it('should reject invalid PORT values', () => {
    const res = envSchema.safeParse({
      PORT: '999999'
    });
    expect(res.success).toBe(false);
  });
});
