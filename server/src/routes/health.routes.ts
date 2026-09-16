import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/prisma.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const isDbHealthy = await checkDatabaseConnection();

  if (!isDbHealthy) {
    return res.status(503).json({
      success: false,
      data: {
        status: 'degraded',
        database: 'disconnected',
        service: 'Vynexa CRM API Engine',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently unreachable'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      database: 'connected',
      service: 'Vynexa CRM API Engine',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    error: null
  });
});

export default router;
