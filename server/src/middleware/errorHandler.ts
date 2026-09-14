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
