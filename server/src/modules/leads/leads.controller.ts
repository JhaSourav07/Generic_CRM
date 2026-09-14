import { Request, Response, NextFunction } from 'express';
import { leadsService } from './leads.service.js';
import {
  getLeadsQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  changeLeadStatusSchema,
  convertLeadSchema
} from './leads.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class LeadsController {
  public async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const query = getLeadsQuerySchema.parse(req.query);
      const result = await leadsService.getLeads(req.user.organizationId, query);

      res.status(200).json({
        success: true,
        data: result.leads,
        meta: result.meta,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const lead = await leadsService.getLeadById(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: lead,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createLeadSchema.parse(req.body);
      const lead = await leadsService.createLead(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: lead,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = updateLeadSchema.parse(req.body);
      const updated = await leadsService.updateLead(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async assignLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const { ownerId } = assignLeadSchema.parse(req.body);
      const updated = await leadsService.assignLead(req.user.organizationId, req.user.userId, id, ownerId);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async changeLeadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const { status } = changeLeadStatusSchema.parse(req.body);
      const updated = await leadsService.changeLeadStatus(req.user.organizationId, req.user.userId, id, status);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const result = await leadsService.deleteLead(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async convertLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = convertLeadSchema.parse(req.body);
      const result = await leadsService.convertLead(req.user.organizationId, req.user.userId, id, input);

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

export const leadsController = new LeadsController();
