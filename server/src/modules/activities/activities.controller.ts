import { Request, Response, NextFunction } from 'express';
import {
  createActivitySchema,
  updateActivitySchema,
  getActivitiesQuerySchema,
  getTimelineQuerySchema
} from './activities.validation.js';
import { activitiesService } from './activities.service.js';

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

export class ActivitiesController {
  public async getActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = (req as any).user.organizationId;
      const parsedQuery = getActivitiesQuerySchema.parse(req.query);

      const result = await activitiesService.getActivities(organizationId, parsedQuery);

      res.status(200).json({
        success: true,
        data: result.activities,
        meta: result.meta,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getActivityById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = (req as any).user.organizationId;
      const { id } = req.params;

      const activity = await activitiesService.getActivityById(organizationId, id);

      res.status(200).json({
        success: true,
        data: activity,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = createActivitySchema.parse(req.body);

      const activity = await activitiesService.createActivity(
        context,
        input
      );

      res.status(201).json({
        success: true,
        data: activity,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;
      const input = updateActivitySchema.parse(req.body);

      const activity = await activitiesService.updateActivity(
        context,
        id,
        input
      );

      res.status(200).json({
        success: true,
        data: activity,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { id } = req.params;

      const result = await activitiesService.deleteActivity(
        context,
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

  public async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = (req as any).user.organizationId;
      const parsedQuery = getTimelineQuerySchema.parse(req.query);

      const timeline = await activitiesService.getTimeline(organizationId, parsedQuery);

      res.status(200).json({
        success: true,
        data: timeline,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const activitiesController = new ActivitiesController();
