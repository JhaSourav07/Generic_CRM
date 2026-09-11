import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware setup
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint was not found on this server.'
    }
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
