import { Request, Response, NextFunction } from 'express';
import { supportCasesService } from './support.service.js';
import {
  listSupportCasesSchema,
  createSupportCaseSchema,
  updateSupportCaseSchema,
  assignSupportCaseSchema,
  changeSupportCaseStatusSchema,
  resolveSupportCaseSchema,
  closeSupportCaseSchema
} from './support.validation.js';
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

export class SupportCasesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const query = listSupportCasesSchema.parse(req.query);
      const result = await supportCasesService.listCases(context, query);
      res.json({
        success: true,
        data: result.cases,
        meta: result.pagination,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const supportCase = await supportCasesService.getCaseById(context, req.params.id);
      res.json({
        success: true,
        data: supportCase,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = createSupportCaseSchema.parse(req.body);
      const supportCase = await supportCasesService.createCase(context, input);
      res.status(201).json({
        success: true,
        data: supportCase,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = updateSupportCaseSchema.parse(req.body);
      const updated = await supportCasesService.updateCase(context, req.params.id, input);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = assignSupportCaseSchema.parse(req.body);
      const updated = await supportCasesService.assignCase(context, req.params.id, input);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = changeSupportCaseStatusSchema.parse(req.body);
      const updated = await supportCasesService.changeStatus(context, req.params.id, input);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = resolveSupportCaseSchema.parse(req.body);
      const updated = await supportCasesService.resolveCase(context, req.params.id, input);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = closeSupportCaseSchema.parse(req.body || {});
      const updated = await supportCasesService.closeCase(context, req.params.id, input);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async reopen(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const updated = await supportCasesService.reopenCase(context, req.params.id);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await supportCasesService.deleteCase(context, req.params.id);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const supportCasesController = new SupportCasesController();
