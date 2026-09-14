import { Request, Response, NextFunction } from 'express';
import { pipelinesService } from './pipelines.service.js';
import {
  createPipelineSchema,
  updatePipelineSchema,
  createStageSchema,
  updateStageSchema,
  reorderStagesSchema
} from './pipelines.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class PipelinesController {
  public async getPipelines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const pipelines = await pipelinesService.getPipelines(req.user.organizationId);

      res.status(200).json({
        success: true,
        data: pipelines,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPipelineById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const pipeline = await pipelinesService.getPipelineById(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: pipeline,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createPipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createPipelineSchema.parse(req.body);
      const pipeline = await pipelinesService.createPipeline(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: pipeline,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updatePipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = updatePipelineSchema.parse(req.body);
      const updated = await pipelinesService.updatePipeline(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deletePipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const result = await pipelinesService.deletePipeline(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getStages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const stages = await pipelinesService.getStages(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: stages,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = createStageSchema.parse(req.body);
      const stage = await pipelinesService.createStage(req.user.organizationId, req.user.userId, id, input);

      res.status(201).json({
        success: true,
        data: stage,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = updateStageSchema.parse(req.body);
      const updated = await pipelinesService.updateStage(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const result = await pipelinesService.deleteStage(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPipelineBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const boardData = await pipelinesService.getPipelineBoard(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: boardData,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async reorderStages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = reorderStagesSchema.parse(req.body);
      const result = await pipelinesService.reorderStages(req.user.organizationId, req.user.userId, id, input);

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

export const pipelinesController = new PipelinesController();
