import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { signupSchema, loginSchema } from './auth.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

export class AuthController {
  /**
   * POST /api/auth/signup
   * Register a new Organization and Administrator User account
   */
  public async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = signupSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
        const error: AppError = new Error(errorMsg);
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }

      const { token, user } = await authService.signup(parseResult.data);

      res.cookie('vynexa_token', token, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        data: {
          user,
          token
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user credentials and issue session token
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
        const error: AppError = new Error(errorMsg);
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        return next(error);
      }

      const { token, user } = await authService.login(parseResult.data);

      res.cookie('vynexa_token', token, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user,
          token
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   * Terminate user session and clear authentication cookie
   */
  public async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('vynexa_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax'
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully'
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   * Retrieve current authenticated user profile
   */
  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const user = await authService.getMe(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          user
        },
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
