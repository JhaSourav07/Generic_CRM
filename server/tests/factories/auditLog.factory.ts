import { prismaTest } from '../helpers/testDb.js';
import crypto from 'crypto';

export interface CreateAuditLogOptions {
  organizationId: string;
  userId?: string | null;
  action?: string;
  entity?: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export async function createTestAuditLog(options: CreateAuditLogOptions) {
  const uid = crypto.randomUUID();
  return prismaTest.auditLog.create({
    data: {
      organizationId: options.organizationId,
      userId: options.userId !== undefined ? options.userId : null,
      action: options.action || 'TEST_ACTION',
      entity: options.entity || 'Lead',
      entityId: options.entityId || uid,
      oldValue: options.oldValue || null,
      newValue: options.newValue || null,
      metadata: options.metadata || null,
      createdAt: options.createdAt || new Date()
    }
  });
}
