import { describe, it, expect, vi } from 'vitest';
import { env, parseEnv } from '../../src/config/env.js';

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
});
