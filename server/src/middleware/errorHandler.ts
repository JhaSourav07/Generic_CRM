import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server.';

  // Log error details server-side
  console.error(`[ERROR] ${errorCode} (${statusCode}): ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message: process.env.NODE_ENV === 'production' && statusCode === 500 
        ? 'Internal server error' 
        : message
    }
  });
};
