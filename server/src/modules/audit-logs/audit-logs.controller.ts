import { Request, Response, NextFunction } from 'express';
import { auditLogsService } from './audit-logs.service.js';
import { listAuditLogsSchema, getAuditLogParamsSchema } from './audit-logs.validation.js';
import { AuthContext } from '../../utils/rbac.js';

function getAuthContext(req: Request): AuthContext {
  const user = (req as any).user;
  return {
    userId: user.userId || user.id,
    email: user.email,
    role: user.role || user.roleName,
    organizationId: user.organizationId
  };
}

export class AuditLogsController {
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = getAuthContext(req);
      const validatedQuery = listAuditLogsSchema.parse(req.query);
      const result = await auditLogsService.getAuditLogs(context, validatedQuery);

      res.status(200).json({
        success: true,
        data: result.logs,
        meta: result.meta,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAuditLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = getAuthContext(req);
      const { id } = getAuditLogParamsSchema.parse(req.params);
      const log = await auditLogsService.getAuditLogById(context, id);

      res.status(200).json({
        success: true,
        data: log,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogsController = new AuditLogsController();
