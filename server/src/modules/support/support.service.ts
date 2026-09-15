import { PrismaClient, Prisma, SupportCaseStatus, SupportCasePriority } from '@prisma/client';
import { AuthContext } from '../../utils/rbac.js';
import {
  ListSupportCasesQuery,
  CreateSupportCaseInput,
  UpdateSupportCaseInput,
  AssignSupportCaseInput,
  ChangeSupportCaseStatusInput,
  ResolveSupportCaseInput,
  CloseSupportCaseInput
} from './support.validation.js';
import { notificationsService } from '../notifications/notifications.service.js';

const prisma = new PrismaClient();

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export class SupportCasesService {
  /**
   * Helper to format case for API response with human-readable case number.
   */
  private formatCase(supportCase: any) {
    if (!supportCase) return supportCase;
    return {
      ...supportCase,
      caseNumber: `CASE-${supportCase.id.substring(0, 8).toUpperCase()}`
    };
  }

  /**
   * Validate relational integrity between customer account and contact.
   */
  private async validateRelationships(
    tx: Prisma.TransactionClient,
    organizationId: string,
    accountId?: string | null,
    contactId?: string | null,
    assignedToId?: string | null
  ) {
    if (accountId) {
      const account = await tx.account.findFirst({
        where: { id: accountId, organizationId, deletedAt: null }
      });
      if (!account) {
        const err: AppError = new Error('Customer account not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    if (contactId) {
      const contact = await tx.contact.findFirst({
        where: { id: contactId, organizationId, deletedAt: null }
      });
      if (!contact) {
        const err: AppError = new Error('Contact not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (accountId && contact.accountId && contact.accountId !== accountId) {
        const err: AppError = new Error('Referenced Contact does not belong to the selected Customer Account.');
        err.statusCode = 400;
        err.code = 'INCONSISTENT_RELATION';
        throw err;
      }
    }

    if (assignedToId) {
      const assignee = await tx.user.findFirst({
        where: { id: assignedToId, organizationId, isActive: true }
      });
      if (!assignee) {
        const err: AppError = new Error('Assigned user was not found, is inactive, or belongs to another organization.');
        err.statusCode = 400;
        err.code = 'INVALID_ASSIGNEE';
        throw err;
      }
    }
  }

  /**
   * List paginated support cases with search and filtering.
   */
  async listCases(context: AuthContext, query: ListSupportCasesQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      accountId,
      contactId,
      assignedToId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.SupportCaseWhereInput = {
      organizationId: context.organizationId,
      deletedAt: null
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (accountId) where.accountId = accountId;
    if (contactId) where.contactId = contactId;
    if (assignedToId) where.assignedToId = assignedToId;

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { account: { name: { contains: term, mode: 'insensitive' } } },
        { contact: { firstName: { contains: term, mode: 'insensitive' } } },
        { contact: { lastName: { contains: term, mode: 'insensitive' } } }
      ];
    }

    const [total, cases] = await Promise.all([
      prisma.supportCase.count({ where }),
      prisma.supportCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { documents: true } }
        }
      })
    ]);

    return {
      cases: cases.map((c) => this.formatCase(c)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single case by ID with full relations.
   */
  async getCaseById(context: AuthContext, id: string) {
    const supportCase = await prisma.supportCase.findFirst({
      where: {
        id,
        organizationId: context.organizationId,
        deletedAt: null
      },
      include: {
        account: { select: { id: true, name: true, industry: true, email: true, phone: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, jobTitle: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        documents: {
          where: { deletedAt: null },
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!supportCase) {
      const err: AppError = new Error('Support case not found in your organization.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Also fetch activities and audit logs for the case timeline
    const [activities, auditLogs] = await Promise.all([
      prisma.activity.findMany({
        where: {
          organizationId: context.organizationId,
          OR: [
            ...(supportCase.accountId ? [{ accountId: supportCase.accountId }] : []),
            ...(supportCase.contactId ? [{ contactId: supportCase.contactId }] : [])
          ]
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { activityDate: 'desc' },
        take: 20
      }),
      prisma.auditLog.findMany({
        where: {
          organizationId: context.organizationId,
          entity: 'SupportCase',
          entityId: id
        },
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    return {
      ...this.formatCase(supportCase),
      timeline: {
        activities,
        auditLogs
      }
    };
  }

  /**
   * Create new support case.
   */
  async createCase(context: AuthContext, input: CreateSupportCaseInput) {
    return prisma.$transaction(async (tx) => {
      await this.validateRelationships(
        tx,
        context.organizationId,
        input.accountId,
        input.contactId,
        input.assignedToId
      );

      const supportCase = await tx.supportCase.create({
        data: {
          organizationId: context.organizationId,
          createdById: context.userId,
          subject: input.subject.trim(),
          description: input.description ? input.description.trim() : null,
          priority: input.priority || SupportCasePriority.MEDIUM,
          status: SupportCaseStatus.OPEN,
          accountId: input.accountId || null,
          contactId: input.contactId || null,
          assignedToId: input.assignedToId || null
        },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_CREATED',
          entity: 'SupportCase',
          entityId: supportCase.id,
          newValue: {
            subject: supportCase.subject,
            priority: supportCase.priority,
            status: supportCase.status,
            accountId: supportCase.accountId,
            assignedToId: supportCase.assignedToId
          }
        }
      });

      // Notification if assigned upon creation
      if (input.assignedToId && input.assignedToId !== context.userId) {
        await notificationsService.createNotification({
          organizationId: context.organizationId,
          userId: input.assignedToId,
          type: 'SUPPORT_CASE_ASSIGNED',
          title: 'Support Case Assigned',
          message: `Support case "${supportCase.subject}" has been assigned to you.`
        });
      }

      return this.formatCase(supportCase);
    });
  }

  /**
   * Update support case fields.
   */
  async updateCase(context: AuthContext, id: string, input: UpdateSupportCaseInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supportCase.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Support case not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      const targetAccountId = input.accountId !== undefined ? input.accountId : existing.accountId;
      const targetContactId = input.contactId !== undefined ? input.contactId : existing.contactId;
      const targetAssignedToId = input.assignedToId !== undefined ? input.assignedToId : existing.assignedToId;

      await this.validateRelationships(
        tx,
        context.organizationId,
        targetAccountId,
        targetContactId,
        targetAssignedToId
      );

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          subject: input.subject !== undefined ? input.subject.trim() : undefined,
          description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
          priority: input.priority !== undefined ? input.priority : undefined,
          accountId: input.accountId !== undefined ? input.accountId : undefined,
          contactId: input.contactId !== undefined ? input.contactId : undefined,
          assignedToId: input.assignedToId !== undefined ? input.assignedToId : undefined
        },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_UPDATED',
          entity: 'SupportCase',
          entityId: id,
          oldValue: { subject: existing.subject, priority: existing.priority },
          newValue: { subject: updated.subject, priority: updated.priority }
        }
      });

      return this.formatCase(updated);
    });
  }

  /**
   * Assign case to another user.
   */
  async assignCase(context: AuthContext, id: string, input: AssignSupportCaseInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supportCase.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Support case not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (input.assignedToId) {
        const assignee = await tx.user.findFirst({
          where: { id: input.assignedToId, organizationId: context.organizationId, isActive: true }
        });
        if (!assignee) {
          const err: AppError = new Error('Target user was not found, is inactive, or belongs to another organization.');
          err.statusCode = 400;
          err.code = 'INVALID_ASSIGNEE';
          throw err;
        }
      }

      const updated = await tx.supportCase.update({
        where: { id },
        data: { assignedToId: input.assignedToId },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_ASSIGNED',
          entity: 'SupportCase',
          entityId: id,
          oldValue: { assignedToId: existing.assignedToId },
          newValue: { assignedToId: updated.assignedToId }
        }
      });

      if (input.assignedToId && input.assignedToId !== context.userId) {
        await notificationsService.createNotification({
          organizationId: context.organizationId,
          userId: input.assignedToId,
          type: 'SUPPORT_CASE_ASSIGNED',
          title: 'Support Case Assigned',
          message: `Support case "${existing.subject}" has been assigned to you.`
        });
      }

      return this.formatCase(updated);
    });
  }

  /**
   * Change status with state transition enforcement.
   */
  async changeStatus(context: AuthContext, id: string, input: ChangeSupportCaseStatusInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supportCase.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Support case not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Disallow moving out of CLOSED without explicit reopen action
      if (existing.status === SupportCaseStatus.CLOSED && input.status !== SupportCaseStatus.CLOSED) {
        const err: AppError = new Error('Closed cases cannot be transitioned directly. Please use the Reopen workflow.');
        err.statusCode = 400;
        err.code = 'INVALID_STATUS_TRANSITION';
        throw err;
      }

      const updated = await tx.supportCase.update({
        where: { id },
        data: { status: input.status },
        include: {
          account: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_STATUS_CHANGED',
          entity: 'SupportCase',
          entityId: id,
          oldValue: { status: existing.status },
          newValue: { status: updated.status }
        }
      });

      return this.formatCase(updated);
    });
  }

  /**
   * Resolve support case.
   */
  async resolveCase(context: AuthContext, id: string, input: ResolveSupportCaseInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supportCase.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Support case not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (existing.status === SupportCaseStatus.RESOLVED) {
        const err: AppError = new Error('Case is already resolved.');
        err.statusCode = 400;
        err.code = 'ALREADY_RESOLVED';
        throw err;
      }

      if (existing.status === SupportCaseStatus.CLOSED) {
        const err: AppError = new Error('Cannot resolve an already closed case.');
        err.statusCode = 400;
        err.code = 'INVALID_STATUS_TRANSITION';
        throw err;
      }

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          status: SupportCaseStatus.RESOLVED,
          resolution: input.resolution.trim(),
          resolvedAt: new Date()
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_RESOLVED',
          entity: 'SupportCase',
          entityId: id,
          oldValue: { status: existing.status },
          newValue: { status: SupportCaseStatus.RESOLVED, resolution: updated.resolution }
        }
      });

      return this.formatCase(updated);
    });
  }

  /**
   * Close support case.
   */
  async closeCase(context: AuthContext, id: string, _input?: CloseSupportCaseInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supportCase.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Support case not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (existing.status === SupportCaseStatus.CLOSED) {
        const err: AppError = new Error('Case is already closed.');
        err.statusCode = 400;
        err.code = 'ALREADY_CLOSED';
        throw err;
      }

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          status: SupportCaseStatus.CLOSED
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_CLOSED',
          entity: 'SupportCase',
          entityId: id,
          oldValue: { status: existing.status },
          newValue: { status: SupportCaseStatus.CLOSED }
        }
      });

      return this.formatCase(updated);
    });
  }

  /**
   * Reopen a resolved or closed support case.
   */
  async reopenCase(context: AuthContext, id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supportCase.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Support case not found in your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (existing.status === SupportCaseStatus.OPEN || existing.status === SupportCaseStatus.IN_PROGRESS) {
        const err: AppError = new Error('Only resolved or closed cases can be reopened.');
        err.statusCode = 400;
        err.code = 'INVALID_STATUS_TRANSITION';
        throw err;
      }

      const updated = await tx.supportCase.update({
        where: { id },
        data: {
          status: SupportCaseStatus.OPEN,
          resolvedAt: null
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'SUPPORT_CASE_REOPENED',
          entity: 'SupportCase',
          entityId: id,
          oldValue: { status: existing.status },
          newValue: { status: SupportCaseStatus.OPEN }
        }
      });

      return this.formatCase(updated);
    });
  }

  /**
   * Soft-delete support case.
   */
  async deleteCase(context: AuthContext, id: string) {
    const existing = await prisma.supportCase.findFirst({
      where: { id, organizationId: context.organizationId, deletedAt: null }
    });

    if (!existing) {
      const err: AppError = new Error('Support case not found in your organization.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    await prisma.supportCase.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: 'SUPPORT_CASE_DELETED',
        entity: 'SupportCase',
        entityId: id,
        oldValue: { subject: existing.subject, status: existing.status }
      }
    });

    return { success: true, message: 'Support case deleted successfully.' };
  }
}

export const supportCasesService = new SupportCasesService();
