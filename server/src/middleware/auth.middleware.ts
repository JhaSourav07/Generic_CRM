import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service.js';
import { AppError } from './errorHandler.js';
import { hasPermission, isSuperAdmin } from '../utils/rbac.js';

/**
 * Middleware to enforce authentication on protected endpoints.
 * Extracts JWT token from HttpOnly cookie `vynexa_token` or `Authorization: Bearer <token>` header.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookie first
    if (req.cookies && req.cookies.vynexa_token) {
      token = req.cookies.vynexa_token;
    } 
    // 2. Fall back to Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error: AppError = new Error('Authentication required. Please log in.');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    // 3. Verify token and attach user payload to request
    const payload = authService.verifyToken(token);
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      email: payload.email
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to enforce role-based access control by role names.
 * SUPER_ADMIN role bypasses role-specific restrictions.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const { roleName, email } = req.user;

    // Super admin bypasses role checks
    if (isSuperAdmin({ userId: req.user.userId, email, role: roleName, organizationId: req.user.organizationId }) || allowedRoles.includes(roleName)) {
      return next();
    }

    const error: AppError = new Error('You do not have permission to perform this action');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    next(error);
  };
};

/**
 * Middleware to enforce granular resource & action permissions.
 * Example: `requirePermission('users', 'CREATE')` or `requirePermission('leads', 'VIEW')`
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const context = {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.roleName,
        organizationId: req.user.organizationId
      };

      const allowed = await hasPermission(context, resource, action);
      if (allowed) {
        return next();
      }

      const error: AppError = new Error(`You do not have permission to perform ${action} on ${resource}`);
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      next(error);
    } catch (err) {
      next(err);
    }
  };
};
