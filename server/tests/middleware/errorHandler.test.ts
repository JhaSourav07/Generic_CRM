import { describe, it, expect, vi } from 'vitest';
import { errorHandler, AppError } from '../../src/middleware/errorHandler.js';
import { Request, Response } from 'express';

describe('errorHandler Middleware (unit)', () => {
  it('should handle 4xx client errors with console.warn and return error envelope', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err: AppError = new Error('Invalid input');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';

    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[CLIENT_INFO] VALIDATION_ERROR (400)'));
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input'
      }
    });

    warnSpy.mockRestore();
  });

  it('should handle 5xx server errors with console.error and default fallbacks', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err: AppError = new Error('Database connection failed');

    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SERVER_ERROR] INTERNAL_SERVER_ERROR (500)'),
      err.stack
    );
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed'
      }
    });

    errorSpy.mockRestore();
  });

  it('should fallback to default error message if err.message is empty', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err: AppError = new Error();
    err.message = '';

    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred on the server.'
      }
    });

    errorSpy.mockRestore();
  });

  it('should sanitize 500 error messages to generic message in production environment', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err: AppError = new Error('Sensitive database details string');
    err.statusCode = 500;

    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });

    process.env.NODE_ENV = originalEnv;
    errorSpy.mockRestore();
  });
});
