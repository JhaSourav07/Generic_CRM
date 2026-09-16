import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AuthContext } from '../../utils/rbac.js';
import { ListAuditLogsQuery } from './audit-logs.validation.js';


interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'secret',
  'authsecret',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn',
  'apikey'
];

/**
 * Recursively redacts sensitive keys from audit log JSON payloads
 */
export function sanitizeAuditPayload(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditPayload(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditPayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export class AuditLogsService {
  /**
   * List paginated audit logs with multi-tenant isolation and rich filters
   */
  public async getAuditLogs(context: AuthContext, query: ListAuditLogsQuery) {
    const {
      page,
      limit,
      search,
      action,
      entity,
      entityId,
      userId,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      organizationId: context.organizationId
    };

    if (action) where.action = { equals: action, mode: 'insensitive' };
    if (entity) where.entity = { equals: entity, mode: 'insensitive' };
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
      }
    }

    if (search && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { action: { contains: term, mode: 'insensitive' } },
        { entity: { contains: term, mode: 'insensitive' } },
        { entityId: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    const sanitizedLogs = logs.map((log) => ({
      ...log,
      oldValue: sanitizeAuditPayload(log.oldValue),
      newValue: sanitizeAuditPayload(log.newValue),
      metadata: sanitizeAuditPayload(log.metadata)
    }));

    return {
      logs: sanitizedLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get single audit log detail by ID strictly within active organization
   */
  public async getAuditLogById(context: AuthContext, id: string) {
    const log = await prisma.auditLog.findFirst({
      where: {
        id,
        organizationId: context.organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!log) {
      const error: AppError = new Error('Audit log record not found');
      error.statusCode = 404;
      error.code = 'AUDIT_LOG_NOT_FOUND';
      throw error;
    }

    return {
      ...log,
      oldValue: sanitizeAuditPayload(log.oldValue),
      newValue: sanitizeAuditPayload(log.newValue),
      metadata: sanitizeAuditPayload(log.metadata)
    };
  }
}

export const auditLogsService = new AuditLogsService();
