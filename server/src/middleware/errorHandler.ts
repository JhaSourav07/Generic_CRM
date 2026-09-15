import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';

  if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.errors.map((e) => e.message).join(', ');
  } else if (err.name === 'PrismaClientKnownRequestError' || (typeof err.code === 'string' && /^P\d{4}$/.test(err.code))) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        errorCode = 'DUPLICATE_RECORD';
        message = 'A record with this unique field already exists.';
        break;
      case 'P2003':
        statusCode = 400;
        errorCode = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced related entity does not exist or cannot be modified.';
        break;
      case 'P2025':
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = 'The requested resource was not found.';
        break;
      default:
        statusCode = 500;
        errorCode = 'DATABASE_ERROR';
        message = 'A database operation error occurred.';
        break;
    }
  }

  // Log error details server-side
  if (statusCode >= 500) {
    console.error(`[SERVER_ERROR] ${errorCode} (${statusCode}): ${message}`, err.stack);
  } else {
    console.warn(`[CLIENT_INFO] ${errorCode} (${statusCode}): ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message: process.env.NODE_ENV === 'production' && statusCode >= 500 
        ? 'Internal server error' 
        : message
    }
  });
};
