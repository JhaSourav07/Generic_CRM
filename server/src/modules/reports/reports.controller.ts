import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { reportFilterSchema, exportReportParamsSchema } from './reports.validation.js';
import { AuthContext } from '../../utils/rbac.js';

function getAuthContext(req: Request): AuthContext {
  const user = (req as any).user;
  return {
    userId: user.userId || user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };
}

export class ReportsController {
  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getOverviewReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async leads(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getLeadReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async sales(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getSalesReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async pipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getPipelineReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async activities(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getActivityReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async tasks(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getTaskReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async support(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getSupportReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async campaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const filters = reportFilterSchema.parse(req.query);
      const data = await reportsService.getCampaignReport(context, filters);
      res.json({
        success: true,
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { reportType } = exportReportParamsSchema.parse({ reportType: req.params.reportType });
      const filters = reportFilterSchema.parse(req.query);

      const { filename, csvContent } = await reportsService.exportReportToCsv(context, reportType, filters);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
