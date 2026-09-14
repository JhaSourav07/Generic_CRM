import { Request, Response, NextFunction } from 'express';
import { opportunitiesService } from './opportunities.service.js';
import {
  getOpportunitiesQuerySchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  changeStageSchema,
  assignOpportunitySchema,
  loseOpportunitySchema
} from './opportunities.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class OpportunitiesController {
  public async getOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const query = getOpportunitiesQuerySchema.parse(req.query);
      const result = await opportunitiesService.getOpportunities(req.user.organizationId, query);

      res.status(200).json({
        success: true,
        data: result.opportunities,
        meta: result.meta,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getOpportunityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const opp = await opportunitiesService.getOpportunityById(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: opp,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createOpportunitySchema.parse(req.body);
      const opp = await opportunitiesService.createOpportunity(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: opp,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = updateOpportunitySchema.parse(req.body);
      const updated = await opportunitiesService.updateOpportunity(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const result = await opportunitiesService.deleteOpportunity(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async changeStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const { stageId } = changeStageSchema.parse(req.body);
      const updated = await opportunitiesService.changeStage(req.user.organizationId, req.user.userId, id, stageId);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async assignOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const { ownerId } = assignOpportunitySchema.parse(req.body);
      const updated = await opportunitiesService.assignOpportunity(req.user.organizationId, req.user.userId, id, ownerId);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async winOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const updated = await opportunitiesService.winOpportunity(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async loseOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = loseOpportunitySchema.parse(req.body);
      const updated = await opportunitiesService.loseOpportunity(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const opportunitiesController = new OpportunitiesController();
