import { describe, it, expect, vi } from 'vitest';
import { logger, sanitizeLogData } from '../../src/utils/logger.js';

describe('Structured Logger Utility (unit)', () => {
  it('should redact sensitive keys from log metadata objects', () => {
    const sensitive = {
      user: 'admin',
      password: 'mypassword123',
      token: 'jwt-token-val',
      nested: {
        authorization: 'Bearer secret-token',
        cookie: 'session-id',
        safeKey: 'hello'
      },
      list: [{ apiKey: 'key-123' }, 'normal-string']
    };

    const sanitized = sanitizeLogData(sensitive);
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.nested.authorization).toBe('[REDACTED]');
    expect(sanitized.nested.cookie).toBe('[REDACTED]');
    expect(sanitized.nested.safeKey).toBe('hello');
    expect(sanitized.list[0].apiKey).toBe('[REDACTED]');
  });

  it('should handle null, undefined, primitives, and Error objects in sanitizeLogData', () => {
    expect(sanitizeLogData(null)).toBeNull();
    expect(sanitizeLogData(undefined)).toBeUndefined();
    expect(sanitizeLogData('simple')).toBe('simple');
    expect(sanitizeLogData(123)).toBe(123);
    expect(sanitizeLogData(true)).toBe(true);

    const err = new Error('Test failure');
    const sanitizedErr = sanitizeLogData(err);
    expect(sanitizedErr.name).toBe('Error');
    expect(sanitizedErr.message).toBe('Test failure');
    expect(sanitizedErr.stack).toBeDefined();

    const errWithProps = Object.assign(new Error('Custom error'), { code: 'ERR_CUSTOM', status: 400 });
    const sanitizedWithProps = sanitizeLogData(errWithProps);
    expect(sanitizedWithProps.code).toBe('ERR_CUSTOM');
    expect(sanitizedWithProps.status).toBe(400);
  });

  it('should log messages via console methods with formatting', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('Info test message', { safeKey: 'val' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Info test message'));

    logger.info('Info without meta');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Info without meta'));

    logger.warn('Warn test message');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Warn test message'));

    logger.error('Error test message', { code: 'ERR' });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error test message'));

    logger.debug('Debug test message');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Debug test message'));

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should format logs as structured JSON when isProduction is true', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Temporarily mutate isProduction
    (logger as any).isProduction = true;

    logger.info('Prod info', { user: 'test' });
    logger.info('Prod info no meta');
    logger.warn('Prod warn', { token: 'secret' });
    logger.error('Prod error', { err: 'fatal' });
    logger.debug('Prod debug'); // Debug skipped in production

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"token":"[REDACTED]"'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"ERROR"'));

    (logger as any).isProduction = false;
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
