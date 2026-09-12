import { Request, Response, NextFunction } from 'express';
import { rolesService } from './roles.service.js';
import { createRoleSchema, updateRoleSchema } from './roles.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class RolesController {
  public async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const roles = await rolesService.getRoles(req.user.organizationId);

      res.status(200).json({
        success: true,
        data: roles,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const role = await rolesService.getRoleById(req.user.organizationId, req.params.id);

      res.status(200).json({
        success: true,
        data: role,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createRoleSchema.parse(req.body);
      const newRole = await rolesService.createRole(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: newRole,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = updateRoleSchema.parse(req.body);
      const updatedRole = await rolesService.updateRole(
        req.user.organizationId,
        req.user.userId,
        req.params.id,
        input
      );

      res.status(200).json({
        success: true,
        data: updatedRole,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      await rolesService.deleteRole(req.user.organizationId, req.user.userId, req.params.id);

      res.status(200).json({
        success: true,
        data: { message: 'Role deleted successfully' },
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await rolesService.getPermissions();

      res.status(200).json({
        success: true,
        data: permissions,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const rolesController = new RolesController();
