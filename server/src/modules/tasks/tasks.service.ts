import { PrismaClient, Prisma, TaskStatus } from '@prisma/client';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ChangeTaskStatusInput,
  AssignTaskInput,
  GetTasksQuery
} from './tasks.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class TasksService {
  /**
   * Helper to calculate start and end UTC timestamps of "today" in a specified IANA timezone.
   */
  public getTimezoneDayRange(timeZone = 'UTC'): { startUtc: Date; endUtc: Date } {
    try {
      const now = new Date();
      const dStr = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
      const [year, month, day] = dStr.split('-').map(Number);

      const invDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone }));
      const diff = targetDate.getTime() - invDate.getTime();

      const startUtc = new Date(Date.UTC(year, month - 1, day) - diff);
      const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
      return { startUtc, endUtc };
    } catch {
      // Fallback to UTC if invalid timezone string
      const now = new Date();
      const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      return { startUtc, endUtc };
    }
  }

  /**
   * Helper to validate that all referenced CRM entities belong to the current organization
   * and satisfy relational consistency rules.
   */
  public async validateEntityRelationships(
    tx: Prisma.TransactionClient,
    organizationId: string,
    relations: {
      leadId?: string | null;
      accountId?: string | null;
      contactId?: string | null;
      opportunityId?: string | null;
      assignedToId?: string | null;
    }
  ) {
    const { leadId, accountId, contactId, opportunityId, assignedToId } = relations;

    // 1. Verify Assigned User if specified
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

    // 2. Verify Lead if specified
    if (leadId) {
      const lead = await tx.lead.findFirst({
        where: { id: leadId, organizationId, deletedAt: null }
      });
      if (!lead) {
        const err: AppError = new Error('Referenced Lead was not found or does not belong to your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    // 3. Verify Account if specified
    if (accountId) {
      const account = await tx.account.findFirst({
        where: { id: accountId, organizationId, deletedAt: null }
      });
      if (!account) {
        const err: AppError = new Error('Referenced Account was not found or does not belong to your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    // 4. Verify Contact if specified
    if (contactId) {
      const contact = await tx.contact.findFirst({
        where: { id: contactId, organizationId, deletedAt: null }
      });
      if (!contact) {
        const err: AppError = new Error('Referenced Contact was not found or does not belong to your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Consistency: If accountId also provided, contact must belong to this account
      if (accountId && contact.accountId && contact.accountId !== accountId) {
        const err: AppError = new Error('Referenced Contact does not belong to the selected Customer Account.');
        err.statusCode = 400;
        err.code = 'INCONSISTENT_RELATION';
        throw err;
      }
    }

    // 5. Verify Opportunity if specified
    if (opportunityId) {
      const opportunity = await tx.opportunity.findFirst({
        where: { id: opportunityId, organizationId, deletedAt: null }
      });
      if (!opportunity) {
        const err: AppError = new Error('Referenced Opportunity was not found or does not belong to your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Consistency: If accountId also provided, opportunity must belong to this account
      if (accountId && opportunity.accountId && opportunity.accountId !== accountId) {
        const err: AppError = new Error('Referenced Opportunity does not belong to the selected Customer Account.');
        err.statusCode = 400;
        err.code = 'INCONSISTENT_RELATION';
        throw err;
      }
    }
  }

  /**
   * Validate controlled status transition.
   */
  public validateStatusTransition(currentStatus: TaskStatus, nextStatus: TaskStatus) {
    if (currentStatus === nextStatus) return;

    const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
      TODO: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      IN_PROGRESS: [TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.TODO],
      COMPLETED: [TaskStatus.TODO], // Reopening completed task
      CANCELLED: [TaskStatus.TODO]  // Reopening cancelled task
    };

    const validTargets = allowedTransitions[currentStatus] || [];
    if (!validTargets.includes(nextStatus)) {
      const err: AppError = new Error(
        `Invalid task status transition from '${currentStatus}' to '${nextStatus}'.`
      );
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }
  }

  /**
   * List tasks with pagination, search, status/priority filtering, due dates, and timezone handling.
   */
  public async getTasks(organizationId: string, query: Partial<GetTasksQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Fetch tenant timezone for date-based categorization
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true }
    });
    const tz = org?.timezone || 'UTC';
    const { startUtc: todayStart, endUtc: todayEnd } = this.getTimezoneDayRange(tz);
    const now = new Date();

    const whereClause: Prisma.TaskWhereInput = {
      organizationId,
      deletedAt: null
    };

    // 1. Text Search across title, description, and related entity names
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { lead: { OR: [{ firstName: { contains: searchTerm, mode: 'insensitive' } }, { lastName: { contains: searchTerm, mode: 'insensitive' } }, { company: { contains: searchTerm, mode: 'insensitive' } }] } },
        { account: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { contact: { OR: [{ firstName: { contains: searchTerm, mode: 'insensitive' } }, { lastName: { contains: searchTerm, mode: 'insensitive' } }] } },
        { opportunity: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { assignedTo: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // 2. Status & Priority filters
    if (query.status) whereClause.status = query.status;
    if (query.priority) whereClause.priority = query.priority;
    if (query.assignedToId) whereClause.assignedToId = query.assignedToId;

    // 3. Entity relations
    if (query.leadId) whereClause.leadId = query.leadId;
    if (query.accountId) whereClause.accountId = query.accountId;
    if (query.contactId) whereClause.contactId = query.contactId;
    if (query.opportunityId) whereClause.opportunityId = query.opportunityId;

    // 4. Overdue filter: dueDate < todayStart (or < now) and status not COMPLETED/CANCELLED
    if (query.overdue === true) {
      whereClause.dueDate = { lt: now };
      whereClause.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    // 5. Due Today filter
    if (query.dueToday === true) {
      whereClause.dueDate = { gte: todayStart, lte: todayEnd };
    }

    // 6. Upcoming filter (due after today up to 14 days)
    if (query.upcoming === true) {
      const futureLimit = new Date(todayEnd.getTime() + 14 * 24 * 60 * 60 * 1000);
      whereClause.dueDate = { gt: todayEnd, lte: futureLimit };
      whereClause.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    // 7. Explicit date range filter
    if (query.startDate || query.endDate) {
      whereClause.dueDate = {
        ...(whereClause.dueDate as Prisma.DateTimeNullableFilter || {}),
        ...(query.startDate ? { gte: query.startDate } : {}),
        ...(query.endDate ? { lte: query.endDate } : {})
      };
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
    const sortField = query.sortBy || 'dueDate';
    const sortOrder = query.sortOrder || 'asc';

    orderBy.push({ [sortField]: sortOrder });
    // Stable secondary sort
    if (sortField !== 'createdAt') {
      orderBy.push({ createdAt: 'desc' });
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      })
    ]);

    // Also compute summary metrics for work-queue overview
    const [overdueCount, dueTodayCount, openCount, completedCount] = await Promise.all([
      prisma.task.count({
        where: {
          organizationId,
          deletedAt: null,
          dueDate: { lt: now },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
        }
      }),
      prisma.task.count({
        where: {
          organizationId,
          deletedAt: null,
          dueDate: { gte: todayStart, lte: todayEnd },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
        }
      }),
      prisma.task.count({
        where: {
          organizationId,
          deletedAt: null,
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] }
        }
      }),
      prisma.task.count({
        where: {
          organizationId,
          deletedAt: null,
          status: TaskStatus.COMPLETED
        }
      })
    ]);

    return {
      tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      summary: {
        openCount,
        overdueCount,
        dueTodayCount,
        completedCount
      }
    };
  }

  /**
   * Get single task by ID.
   */
  public async getTaskById(organizationId: string, id: string) {
    const task = await prisma.task.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        opportunity: { select: { id: true, name: true } }
      }
    });

    if (!task) {
      const err: AppError = new Error('Task record not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return task;
  }

  /**
   * Create a new task with cross-entity validation and notifications.
   */
  public async createTask(
    context: { userId: string; organizationId: string },
    input: CreateTaskInput
  ) {
    return prisma.$transaction(async (tx) => {
      // Validate cross-entity relations
      await this.validateEntityRelationships(tx, context.organizationId, {
        leadId: input.leadId,
        accountId: input.accountId,
        contactId: input.contactId,
        opportunityId: input.opportunityId,
        assignedToId: input.assignedToId
      });

      const isCompleted = input.status === TaskStatus.COMPLETED;

      const task = await tx.task.create({
        data: {
          organizationId: context.organizationId,
          createdById: context.userId,
          assignedToId: input.assignedToId || null,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate || null,
          completedAt: isCompleted ? new Date() : null,
          leadId: input.leadId || null,
          accountId: input.accountId || null,
          contactId: input.contactId || null,
          opportunityId: input.opportunityId || null
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      });

      // Notification if assigned to a colleague
      if (input.assignedToId && input.assignedToId !== context.userId) {
        await tx.notification.create({
          data: {
            organizationId: context.organizationId,
            userId: input.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You were assigned task "${task.title}".`
          }
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'TASK_CREATED',
          entity: 'Task',
          entityId: task.id,
          newValue: {
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            assignedToId: task.assignedToId
          }
        }
      });

      return task;
    });
  }

  /**
   * Update an existing task.
   */
  public async updateTask(
    context: { userId: string; organizationId: string },
    id: string,
    input: UpdateTaskInput
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Task record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Check status transition if changing
      if (input.status && input.status !== existing.status) {
        this.validateStatusTransition(existing.status, input.status);
      }

      const resolvedLeadId = input.leadId !== undefined ? input.leadId : existing.leadId;
      const resolvedAccountId = input.accountId !== undefined ? input.accountId : existing.accountId;
      const resolvedContactId = input.contactId !== undefined ? input.contactId : existing.contactId;
      const resolvedOpportunityId = input.opportunityId !== undefined ? input.opportunityId : existing.opportunityId;
      const resolvedAssignedToId = input.assignedToId !== undefined ? input.assignedToId : existing.assignedToId;

      await this.validateEntityRelationships(tx, context.organizationId, {
        leadId: resolvedLeadId,
        accountId: resolvedAccountId,
        contactId: resolvedContactId,
        opportunityId: resolvedOpportunityId,
        assignedToId: resolvedAssignedToId
      });

      let completedAt = existing.completedAt;
      if (input.status) {
        if (input.status === TaskStatus.COMPLETED && !completedAt) {
          completedAt = new Date();
        } else if (input.status !== TaskStatus.COMPLETED) {
          completedAt = null;
        }
      }

      const updated = await tx.task.update({
        where: { id },
        data: {
          title: input.title !== undefined ? input.title.trim() : undefined,
          description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
          status: input.status !== undefined ? input.status : undefined,
          priority: input.priority !== undefined ? input.priority : undefined,
          dueDate: input.dueDate !== undefined ? input.dueDate : undefined,
          completedAt,
          assignedToId: input.assignedToId !== undefined ? input.assignedToId : undefined,
          leadId: input.leadId !== undefined ? input.leadId : undefined,
          accountId: input.accountId !== undefined ? input.accountId : undefined,
          contactId: input.contactId !== undefined ? input.contactId : undefined,
          opportunityId: input.opportunityId !== undefined ? input.opportunityId : undefined
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      });

      // Notification if re-assigned to someone else
      if (
        input.assignedToId &&
        input.assignedToId !== existing.assignedToId &&
        input.assignedToId !== context.userId
      ) {
        await tx.notification.create({
          data: {
            organizationId: context.organizationId,
            userId: input.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'Task Reassigned to You',
            message: `You were assigned task "${updated.title}".`
          }
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'TASK_UPDATED',
          entity: 'Task',
          entityId: id,
          oldValue: {
            title: existing.title,
            status: existing.status,
            priority: existing.priority,
            dueDate: existing.dueDate,
            assignedToId: existing.assignedToId
          },
          newValue: {
            title: updated.title,
            status: updated.status,
            priority: updated.priority,
            dueDate: updated.dueDate,
            assignedToId: updated.assignedToId
          }
        }
      });

      return updated;
    });
  }

  /**
   * Change task status with controlled workflow state validation.
   */
  public async changeStatus(
    context: { userId: string; organizationId: string },
    id: string,
    input: ChangeTaskStatusInput
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Task record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      this.validateStatusTransition(existing.status, input.status);

      const completedAt = input.status === TaskStatus.COMPLETED
        ? new Date()
        : null;

      const updated = await tx.task.update({
        where: { id },
        data: {
          status: input.status,
          completedAt
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'TASK_STATUS_CHANGED',
          entity: 'Task',
          entityId: id,
          oldValue: { status: existing.status },
          newValue: { status: updated.status }
        }
      });

      return updated;
    });
  }

  /**
   * Assign a task to an active user in the organization.
   */
  public async assignTask(
    context: { userId: string; organizationId: string },
    id: string,
    input: AssignTaskInput
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Task record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (input.assignedToId) {
        const assignee = await tx.user.findFirst({
          where: { id: input.assignedToId, organizationId: context.organizationId, isActive: true }
        });
        if (!assignee) {
          const err: AppError = new Error('Assigned user was not found, is inactive, or belongs to another organization.');
          err.statusCode = 400;
          err.code = 'INVALID_ASSIGNEE';
          throw err;
        }
      }

      const updated = await tx.task.update({
        where: { id },
        data: {
          assignedToId: input.assignedToId
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      });

      // Notification
      if (input.assignedToId && input.assignedToId !== context.userId) {
        await tx.notification.create({
          data: {
            organizationId: context.organizationId,
            userId: input.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'Task Assigned',
            message: `You were assigned task "${updated.title}".`
          }
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'TASK_ASSIGNED',
          entity: 'Task',
          entityId: id,
          oldValue: { assignedToId: existing.assignedToId },
          newValue: { assignedToId: updated.assignedToId }
        }
      });

      return updated;
    });
  }

  /**
   * Complete a task (sets status: COMPLETED, completedAt: new Date()).
   */
  public async completeTask(
    context: { userId: string; organizationId: string },
    id: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Task record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      if (existing.status === TaskStatus.COMPLETED) {
        return existing; // Idempotent completion
      }

      const updated = await tx.task.update({
        where: { id },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: new Date()
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'TASK_COMPLETED',
          entity: 'Task',
          entityId: id,
          oldValue: { status: existing.status, completedAt: null },
          newValue: { status: TaskStatus.COMPLETED, completedAt: updated.completedAt }
        }
      });

      return updated;
    });
  }

  /**
   * Delete a task (soft delete with deletedAt timestamp).
   */
  public async deleteTask(
    context: { userId: string; organizationId: string },
    id: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, organizationId: context.organizationId, deletedAt: null }
      });

      if (!existing) {
        const err: AppError = new Error('Task record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      await tx.task.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'TASK_DELETED',
          entity: 'Task',
          entityId: id,
          oldValue: {
            title: existing.title,
            status: existing.status
          }
        }
      });

      return { id, success: true };
    });
  }
}

export const tasksService = new TasksService();
