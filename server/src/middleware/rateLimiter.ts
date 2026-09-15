import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP or user. Please wait and try again later.',
    keyGenerator = (req) => {
      // Use authenticated user ID if present, otherwise fallback to remote IP
      const user = (req as any).user;
      return user?.userId || req.ip || req.socket.remoteAddress || 'unknown';
    }
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, 120000);

  // Unref interval to allow clean node process shutdown
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing rate limits unless specifically testing rate limiting
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);
    if (!record) {
      record = { timestamps: [] };
      hits.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    // Set rate limit headers
    const remaining = Math.max(0, max - record.timestamps.length - 1);
    const resetTime = Math.ceil(((record.timestamps[0] || now) + windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (record.timestamps.length >= max) {
      res.status(429).json({
        success: false,
        data: null,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message
        }
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// 1. Strict limiter for authentication endpoints (login, signup) - 15 attempts / 60 seconds
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.'
});

// 2. Limiter for high-cost data exports - 30 exports / 5 minutes
export const exportRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Export rate limit reached. Please wait a few minutes before downloading additional reports.'
});
