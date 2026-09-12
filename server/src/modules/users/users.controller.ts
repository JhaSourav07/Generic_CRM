import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { getUsersQuerySchema, createUserSchema, updateUserSchema, toggleUserStatusSchema } from './users.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class UsersController {
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const query = getUsersQuerySchema.parse(req.query);
      const result = await usersService.getUsers(req.user.organizationId, query);

      res.status(200).json({
        success: true,
        data: result.users,
        meta: result.meta,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const user = await usersService.getUserById(req.user.organizationId, req.params.id);

      res.status(200).json({
        success: true,
        data: user,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createUserSchema.parse(req.body);
      const newUser = await usersService.createUser(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: newUser,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = updateUserSchema.parse(req.body);
      const updatedUser = await usersService.updateUser(
        req.user.organizationId,
        req.user.userId,
        req.params.id,
        input
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { isActive } = toggleUserStatusSchema.parse(req.body);
      const updatedUser = await usersService.toggleUserStatus(
        req.user.organizationId,
        req.user.userId,
        req.params.id,
        isActive
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        meta: null,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
