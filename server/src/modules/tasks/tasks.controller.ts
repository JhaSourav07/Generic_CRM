import { Request, Response, NextFunction } from 'express';
import {
  createTaskSchema,
  updateTaskSchema,
  changeTaskStatusSchema,
  assignTaskSchema,
  getTasksQuerySchema
} from './tasks.validation.js';
import { tasksService } from './tasks.service.js';
import { AuthContext } from '../../utils/auth-helpers.js';

function getAuthContext(req: Request): AuthContext {
  const u = (req as any).user;
  return {
    userId: u.userId,
    organizationId: u.organizationId,
    role: u.roleName,
    email: u.email
  };
}

export class TasksController {
  public async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = (req as any).user.organizationId;
      const parsedQuery = getTasksQuerySchema.parse(req.query);

      const result = await tasksService.getTasks(organizationId, parsedQuery);

      res.status(200).json({
        success: true,
        data: result.tasks,
        meta: result.meta,
        summary: result.summary,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = (req as any).user.organizationId;
      const data = await tasksService.getFollowUps(organizationId);

      res.status(200).json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = (req as any).user.organizationId;
      const { id } = req.params;

      const task = await tasksService.getTaskById(organizationId, id);

      res.status(200).json({
        success: true,
        data: task,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = createTaskSchema.parse(req.body);

      const task = await tasksService.createTask(context, input);

      res.status(201).json({
        success: true,
        data: task,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;
      const input = updateTaskSchema.parse(req.body);

      const task = await tasksService.updateTask(context, id, input);

      res.status(200).json({
        success: true,
        data: task,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;
      const input = changeTaskStatusSchema.parse(req.body);

      const task = await tasksService.changeStatus(context, id, input);

      res.status(200).json({
        success: true,
        data: task,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async assignTask(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;
      const input = assignTaskSchema.parse(req.body);

      const task = await tasksService.assignTask(context, id, input);

      res.status(200).json({
        success: true,
        data: task,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async completeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;

      const task = await tasksService.completeTask(context, id);

      res.status(200).json({
        success: true,
        data: task,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;

      const result = await tasksService.deleteTask(context, id);

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

export const tasksController = new TasksController();
