import { Router } from 'express';
import { auditLogsController } from './audit-logs.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const auditLogsRoutes = Router();

// Protect all audit log endpoints with mandatory authentication
auditLogsRoutes.use(requireAuth);

// GET /api/audit-logs - List paginated audit records for current organization
auditLogsRoutes.get(
  '/',
  requirePermission('audit_logs', 'VIEW'),
  (req, res, next) => auditLogsController.getAuditLogs(req, res, next)
);

// GET /api/audit-logs/:id - Inspect single audit log entry
auditLogsRoutes.get(
  '/:id',
  requirePermission('audit_logs', 'VIEW'),
  (req, res, next) => auditLogsController.getAuditLogById(req, res, next)
);
