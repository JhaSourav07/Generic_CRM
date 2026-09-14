import { Request, Response, NextFunction } from 'express';
import { accountsService } from './accounts.service.js';
import {
  getAccountsQuerySchema,
  createAccountSchema,
  updateAccountSchema,
  assignAccountSchema
} from './accounts.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AccountsController {
  public async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const query = getAccountsQuerySchema.parse(req.query);
      const result = await accountsService.getAccounts(req.user.organizationId, query);

      res.status(200).json({
        success: true,
        data: result.accounts,
        meta: result.meta,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const account = await accountsService.getAccountById(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: account,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createAccountSchema.parse(req.body);
      const account = await accountsService.createAccount(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: account,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = updateAccountSchema.parse(req.body);
      const updated = await accountsService.updateAccount(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async assignAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const { ownerId } = assignAccountSchema.parse(req.body);
      const updated = await accountsService.assignAccount(req.user.organizationId, req.user.userId, id, ownerId);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const result = await accountsService.deleteAccount(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const accountsController = new AccountsController();
