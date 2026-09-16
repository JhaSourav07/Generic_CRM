import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import {
  CreateActivityInput,
  UpdateActivityInput,
  GetActivitiesQuery,
  GetTimelineQuery
} from './activities.validation.js';
import { AppError } from '../../middleware/errorHandler.js';


export class ActivitiesService {
  /**
   * Helper to validate that all referenced CRM entities belong to the current organization
   * and adhere to relational consistency constraints.
   */
  public async validateEntityRelationships(
    tx: Prisma.TransactionClient,
    organizationId: string,
    relations: {
      leadId?: string | null;
      accountId?: string | null;
      contactId?: string | null;
      opportunityId?: string | null;
    }
  ) {
    const { leadId, accountId, contactId, opportunityId } = relations;

    // 1. Verify Lead if specified
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

    // 2. Verify Account if specified
    let verifiedAccount: any = null;
    if (accountId) {
      verifiedAccount = await tx.account.findFirst({
        where: { id: accountId, organizationId, deletedAt: null }
      });
      if (!verifiedAccount) {
        const err: AppError = new Error('Referenced Account was not found or does not belong to your organization.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
    }

    // 3. Verify Contact if specified
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

      // Consistency rule: if accountId is also provided, contact must belong to this account
      if (accountId && contact.accountId && contact.accountId !== accountId) {
        const err: AppError = new Error('Referenced Contact does not belong to the selected Customer Account.');
        err.statusCode = 400;
        err.code = 'INCONSISTENT_RELATION';
        throw err;
      }
    }

    // 4. Verify Opportunity if specified
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

      // Consistency rule: if accountId is also provided, opportunity must belong to this account
      if (accountId && opportunity.accountId && opportunity.accountId !== accountId) {
        const err: AppError = new Error('Referenced Opportunity does not belong to the selected Customer Account.');
        err.statusCode = 400;
        err.code = 'INCONSISTENT_RELATION';
        throw err;
      }
    }
  }

  /**
   * List activities with pagination, search, filters, and deterministic sorting.
   */
  public async getActivities(organizationId: string, query: Partial<GetActivitiesQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ActivityWhereInput = {
      organizationId
    };

    // 1. Text Search across subject and description
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { lead: { OR: [{ firstName: { contains: searchTerm, mode: 'insensitive' } }, { lastName: { contains: searchTerm, mode: 'insensitive' } }, { company: { contains: searchTerm, mode: 'insensitive' } }] } },
        { account: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { contact: { OR: [{ firstName: { contains: searchTerm, mode: 'insensitive' } }, { lastName: { contains: searchTerm, mode: 'insensitive' } }] } },
        { opportunity: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // 2. Type filter
    if (query.type) {
      whereClause.type = query.type;
    }

    // 3. Creator filter
    if (query.createdById) {
      whereClause.createdById = query.createdById;
    }

    // 4. Entity relations filter
    if (query.leadId) whereClause.leadId = query.leadId;
    if (query.accountId) whereClause.accountId = query.accountId;
    if (query.contactId) whereClause.contactId = query.contactId;
    if (query.opportunityId) whereClause.opportunityId = query.opportunityId;

    // 5. Date range filter
    if (query.startDate || query.endDate) {
      whereClause.activityDate = {};
      if (query.startDate) whereClause.activityDate.gte = query.startDate;
      if (query.endDate) whereClause.activityDate.lte = query.endDate;
    }

    const orderBy: Prisma.ActivityOrderByWithRelationInput[] = [];
    const sortField = query.sortBy || 'activityDate';
    const sortOrder = query.sortOrder || 'desc';

    orderBy.push({ [sortField]: sortOrder });
    // Stable secondary sort
    if (sortField !== 'createdAt') {
      orderBy.push({ createdAt: 'desc' });
    }

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where: whereClause }),
      prisma.activity.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } }
        }
      })
    ]);

    return {
      activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get single activity by ID, strictly scoped to the tenant.
   */
  public async getActivityById(organizationId: string, id: string) {
    const activity = await prisma.activity.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        opportunity: { select: { id: true, name: true } }
      }
    });

    if (!activity) {
      const err: AppError = new Error('Activity record not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return activity;
  }

  /**
   * Create a new activity with cross-entity validation and atomic audit logging.
   */
  public async createActivity(
    context: { userId: string; organizationId: string },
    input: CreateActivityInput
  ) {
    return prisma.$transaction(async (tx) => {
      // Validate cross-entity relationships
      await this.validateEntityRelationships(tx, context.organizationId, {
        leadId: input.leadId,
        accountId: input.accountId,
        contactId: input.contactId,
        opportunityId: input.opportunityId
      });

      const activity = await tx.activity.create({
        data: {
          organizationId: context.organizationId,
          createdById: context.userId,
          type: input.type,
          subject: input.subject.trim(),
          description: input.description?.trim() || null,
          activityDate: input.activityDate || new Date(),
          duration: input.duration !== undefined ? input.duration : null,
          leadId: input.leadId || null,
          accountId: input.accountId || null,
          contactId: input.contactId || null,
          opportunityId: input.opportunityId || null
        },
        include: {
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
          action: 'ACTIVITY_CREATED',
          entity: 'Activity',
          entityId: activity.id,
          newValue: {
            type: activity.type,
            subject: activity.subject,
            activityDate: activity.activityDate,
            leadId: activity.leadId,
            accountId: activity.accountId,
            contactId: activity.contactId,
            opportunityId: activity.opportunityId
          }
        }
      });

      return activity;
    });
  }

  /**
   * Update an existing activity with relational integrity checks and audit logging.
   */
  public async updateActivity(
    context: { userId: string; organizationId: string },
    id: string,
    input: UpdateActivityInput
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.activity.findFirst({
        where: { id, organizationId: context.organizationId }
      });

      if (!existing) {
        const err: AppError = new Error('Activity record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Check relationships if any are being updated
      const resolvedLeadId = input.leadId !== undefined ? input.leadId : existing.leadId;
      const resolvedAccountId = input.accountId !== undefined ? input.accountId : existing.accountId;
      const resolvedContactId = input.contactId !== undefined ? input.contactId : existing.contactId;
      const resolvedOpportunityId = input.opportunityId !== undefined ? input.opportunityId : existing.opportunityId;

      await this.validateEntityRelationships(tx, context.organizationId, {
        leadId: resolvedLeadId,
        accountId: resolvedAccountId,
        contactId: resolvedContactId,
        opportunityId: resolvedOpportunityId
      });

      const updated = await tx.activity.update({
        where: { id },
        data: {
          type: input.type !== undefined ? input.type : undefined,
          subject: input.subject !== undefined ? input.subject.trim() : undefined,
          description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
          activityDate: input.activityDate !== undefined ? input.activityDate : undefined,
          duration: input.duration !== undefined ? input.duration : undefined,
          leadId: input.leadId !== undefined ? input.leadId : undefined,
          accountId: input.accountId !== undefined ? input.accountId : undefined,
          contactId: input.contactId !== undefined ? input.contactId : undefined,
          opportunityId: input.opportunityId !== undefined ? input.opportunityId : undefined
        },
        include: {
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
          action: 'ACTIVITY_UPDATED',
          entity: 'Activity',
          entityId: id,
          oldValue: {
            type: existing.type,
            subject: existing.subject,
            activityDate: existing.activityDate,
            duration: existing.duration
          },
          newValue: {
            type: updated.type,
            subject: updated.subject,
            activityDate: updated.activityDate,
            duration: updated.duration
          }
        }
      });

      return updated;
    });
  }

  /**
   * Delete an activity record with audit logging.
   */
  public async deleteActivity(
    context: { userId: string; organizationId: string },
    id: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.activity.findFirst({
        where: { id, organizationId: context.organizationId }
      });

      if (!existing) {
        const err: AppError = new Error('Activity record not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      await tx.activity.delete({
        where: { id }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'ACTIVITY_DELETED',
          entity: 'Activity',
          entityId: id,
          oldValue: {
            subject: existing.subject,
            type: existing.type,
            activityDate: existing.activityDate
          }
        }
      });

      return { id, success: true };
    });
  }

  /**
   * Fetch chronological activity timeline for a specific entity.
   */
  public async getTimeline(
    organizationId: string,
    query: GetTimelineQuery
  ) {
    const limit = query.limit ?? 50;
    const whereClause: Prisma.ActivityWhereInput = {
      organizationId
    };

    if (query.leadId) whereClause.leadId = query.leadId;
    if (query.accountId) whereClause.accountId = query.accountId;
    if (query.contactId) whereClause.contactId = query.contactId;
    if (query.opportunityId) whereClause.opportunityId = query.opportunityId;

    const activities = await prisma.activity.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { activityDate: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        opportunity: { select: { id: true, name: true } }
      }
    });

    return activities;
  }
}

export const activitiesService = new ActivitiesService();
