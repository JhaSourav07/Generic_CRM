import { Request, Response, NextFunction } from 'express';
import {
  createTaskSchema,
  updateTaskSchema,
  changeTaskStatusSchema,
  assignTaskSchema,
  getTasksQuerySchema
} from './tasks.validation.js';
import { tasksService } from './tasks.service.js';

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
      const { userId, organizationId } = (req as any).user;
      const input = createTaskSchema.parse(req.body);

      const task = await tasksService.createTask(
        { userId, organizationId },
        input
      );

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
      const { userId, organizationId } = (req as any).user;
      const { id } = req.params;
      const input = updateTaskSchema.parse(req.body);

      const task = await tasksService.updateTask(
        { userId, organizationId },
        id,
        input
      );

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
      const { userId, organizationId } = (req as any).user;
      const { id } = req.params;
      const input = changeTaskStatusSchema.parse(req.body);

      const task = await tasksService.changeStatus(
        { userId, organizationId },
        id,
        input
      );

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
      const { userId, organizationId } = (req as any).user;
      const { id } = req.params;
      const input = assignTaskSchema.parse(req.body);

      const task = await tasksService.assignTask(
        { userId, organizationId },
        id,
        input
      );

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
      const { userId, organizationId } = (req as any).user;
      const { id } = req.params;

      const task = await tasksService.completeTask(
        { userId, organizationId },
        id
      );

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
      const { userId, organizationId } = (req as any).user;
      const { id } = req.params;

      const result = await tasksService.deleteTask(
        { userId, organizationId },
        id
      );

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
