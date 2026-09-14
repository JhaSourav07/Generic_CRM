import { PrismaClient, Prisma, OpportunityStatus } from '@prisma/client';
import {
  GetOpportunitiesQuery,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  LoseOpportunityInput
} from './opportunities.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class OpportunitiesService {
  /**
   * Helper to format an opportunity for client consumption with safe numeric value.
   */
  private formatOpportunity(opp: any) {
    if (!opp) return opp;
    return {
      ...opp,
      value: Number(opp.value || 0)
    };
  }

  /**
   * List opportunities with server-side pagination, search, filtering, and sorting.
   */
  public async getOpportunities(organizationId: string, query: Partial<GetOpportunitiesQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.OpportunityWhereInput = {
      organizationId,
      deletedAt: null
    };

    // 1. Server-side Search across deal name, account name, contact name, and owner name
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { account: { name: { contains: searchTerm, mode: 'insensitive' } } },
        {
          contact: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        },
        { owner: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // 2. Server-side Filters
    if (query.pipelineId) {
      whereClause.pipelineId = query.pipelineId;
    }

    if (query.stageId) {
      whereClause.stageId = query.stageId;
    }

    if (query.status) {
      whereClause.status = query.status as OpportunityStatus;
    }

    if (query.ownerId) {
      whereClause.ownerId = query.ownerId;
    }

    if (query.accountId) {
      whereClause.accountId = query.accountId;
    }

    if (query.contactId) {
      whereClause.contactId = query.contactId;
    }

    // 3. Sorting
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, rawOpportunities, openAgg, wonAgg, lostAgg] = await Promise.all([
      prisma.opportunity.count({ where: whereClause }),
      prisma.opportunity.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              industry: true,
              website: true
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          pipeline: {
            select: {
              id: true,
              name: true
            }
          },
          stage: {
            select: {
              id: true,
              name: true,
              order: true,
              probability: true
            }
          }
        }
      }),
      prisma.opportunity.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: OpportunityStatus.OPEN,
          ...(query.pipelineId ? { pipelineId: query.pipelineId } : {})
        },
        _sum: { value: true },
        _count: { _all: true }
      }),
      prisma.opportunity.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: OpportunityStatus.WON,
          ...(query.pipelineId ? { pipelineId: query.pipelineId } : {})
        },
        _sum: { value: true },
        _count: { _all: true }
      }),
      prisma.opportunity.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: OpportunityStatus.LOST,
          ...(query.pipelineId ? { pipelineId: query.pipelineId } : {})
        },
        _sum: { value: true },
        _count: { _all: true }
      })
    ]);

    const opportunities = rawOpportunities.map((o) => this.formatOpportunity(o));

    return {
      opportunities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalCount: total,
        openCount: openAgg._count._all,
        openValue: Number(openAgg._sum.value || 0),
        wonCount: wonAgg._count._all,
        wonValue: Number(wonAgg._sum.value || 0),
        lostCount: lostAgg._count._all,
        lostValue: Number(lostAgg._sum.value || 0)
      }
    };
  }

  /**
   * Get single Opportunity by ID within tenant scope with full relational context.
   */
  public async getOpportunityById(organizationId: string, opportunityId: string) {
    const opp = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId,
        deletedAt: null
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            email: true,
            phone: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        pipeline: {
          select: {
            id: true,
            name: true,
            stages: {
              orderBy: { order: 'asc' }
            }
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
            probability: true
          }
        },
        activities: {
          take: 10,
          orderBy: { activityDate: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true } }
          }
        },
        tasks: {
          where: { deletedAt: null },
          take: 10,
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!opp) {
      const error: AppError = new Error('Opportunity not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.formatOpportunity(opp);
  }

  /**
   * Validate related entities (Account, Contact, Pipeline, Stage, Owner) belong to current organization.
   * Also ensures Contact belongs to the selected Account if both are provided.
   */
  private async validateRelationships(
    tx: Prisma.TransactionClient,
    organizationId: string,
    data: {
      accountId?: string | null;
      contactId?: string | null;
      pipelineId: string;
      stageId: string;
      ownerId?: string | null;
    }
  ) {
    // 1. Validate Account
    if (data.accountId) {
      const account = await tx.account.findFirst({
        where: { id: data.accountId, organizationId, deletedAt: null }
      });
      if (!account) {
        const error: AppError = new Error('Customer account not found in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_ACCOUNT';
        throw error;
      }
    }

    // 2. Validate Contact & Customer Relationship
    if (data.contactId) {
      const contact = await tx.contact.findFirst({
        where: { id: data.contactId, organizationId, deletedAt: null }
      });
      if (!contact) {
        const error: AppError = new Error('Contact not found in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_CONTACT';
        throw error;
      }

      // If Account is specified, verify Contact belongs to this Account
      if (data.accountId && contact.accountId && contact.accountId !== data.accountId) {
        const error: AppError = new Error('The selected contact does not belong to the selected customer account');
        error.statusCode = 400;
        error.code = 'CONTACT_ACCOUNT_MISMATCH';
        throw error;
      }
    }

    // 3. Validate Pipeline
    const pipeline = await tx.pipeline.findFirst({
      where: { id: data.pipelineId, organizationId }
    });
    if (!pipeline) {
      const error: AppError = new Error('Sales pipeline not found in this organization');
      error.statusCode = 400;
      error.code = 'INVALID_PIPELINE';
      throw error;
    }

    // 4. Validate Stage belongs to Pipeline
    const stage = await tx.pipelineStage.findFirst({
      where: { id: data.stageId, pipelineId: data.pipelineId }
    });
    if (!stage) {
      const error: AppError = new Error('Pipeline stage does not belong to the selected pipeline');
      error.statusCode = 400;
      error.code = 'INVALID_STAGE';
      throw error;
    }

    // 5. Validate Owner if provided
    if (data.ownerId) {
      const owner = await tx.user.findFirst({
        where: { id: data.ownerId, organizationId, isActive: true }
      });
      if (!owner) {
        const error: AppError = new Error('Target owner does not exist or is inactive in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_OWNER';
        throw error;
      }
    }

    return { stage };
  }

  /**
   * Create a new Opportunity within tenant boundary with strict relational integrity.
   */
  public async createOpportunity(organizationId: string, currentUserId: string, input: CreateOpportunityInput) {
    return await prisma.$transaction(async (tx) => {
      // Validate all relationships
      const { stage } = await this.validateRelationships(tx, organizationId, {
        accountId: input.accountId,
        contactId: input.contactId,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
        ownerId: input.ownerId
      });

      // Default probability to stage probability if not explicitly provided or 0
      const probability = input.probability !== undefined && input.probability > 0
        ? input.probability
        : (stage.probability || 0);

      // Infer status from stage semantics if created directly in Won or Lost stage
      const stageLower = stage.name.toLowerCase();
      let initialStatus: OpportunityStatus = OpportunityStatus.OPEN;
      let initialClosedAt: Date | null = null;
      let initialProb = probability;

      if (stageLower.includes('won') || stage.probability === 1) {
        initialStatus = OpportunityStatus.WON;
        initialClosedAt = new Date();
        initialProb = 1.0;
      } else if (stageLower.includes('lost')) {
        initialStatus = OpportunityStatus.LOST;
        initialClosedAt = new Date();
        initialProb = 0.0;
      }

      const opportunity = await tx.opportunity.create({
        data: {
          organizationId,
          accountId: input.accountId || null,
          contactId: input.contactId || null,
          ownerId: input.ownerId || currentUserId,
          pipelineId: input.pipelineId,
          stageId: input.stageId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          value: new Prisma.Decimal(input.value !== undefined ? input.value : 0),
          probability: initialProb,
          expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
          status: initialStatus,
          closedAt: initialClosedAt
        },
        include: {
          account: { select: { id: true, name: true, industry: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          pipeline: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true, order: true, probability: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'OPPORTUNITY_CREATED',
          entity: 'Opportunity',
          entityId: opportunity.id,
          newValue: {
            name: opportunity.name,
            value: Number(opportunity.value),
            stageId: opportunity.stageId,
            pipelineId: opportunity.pipelineId,
            ownerId: opportunity.ownerId,
            accountId: opportunity.accountId
          }
        }
      });

      return this.formatOpportunity(opportunity);
    });
  }

  /**
   * Update general opportunity details.
   */
  public async updateOpportunity(
    organizationId: string,
    currentUserId: string,
    opportunityId: string,
    input: UpdateOpportunityInput
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.opportunity.findFirst({
        where: { id: opportunityId, organizationId, deletedAt: null },
        include: { stage: true }
      });

      if (!existing) {
        const error: AppError = new Error('Opportunity not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      const targetPipelineId = input.pipelineId || existing.pipelineId;
      const targetStageId = input.stageId || existing.stageId;
      const targetAccountId = input.accountId !== undefined ? input.accountId : existing.accountId;
      const targetContactId = input.contactId !== undefined ? input.contactId : existing.contactId;
      const targetOwnerId = input.ownerId !== undefined ? input.ownerId : existing.ownerId;

      await this.validateRelationships(tx, organizationId, {
        accountId: targetAccountId,
        contactId: targetContactId,
        pipelineId: targetPipelineId,
        stageId: targetStageId,
        ownerId: targetOwnerId
      });

      const updated = await tx.opportunity.update({
        where: { id: opportunityId },
        data: {
          name: input.name !== undefined ? input.name.trim() : undefined,
          description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
          accountId: input.accountId !== undefined ? input.accountId : undefined,
          contactId: input.contactId !== undefined ? input.contactId : undefined,
          pipelineId: input.pipelineId !== undefined ? input.pipelineId : undefined,
          stageId: input.stageId !== undefined ? input.stageId : undefined,
          ownerId: input.ownerId !== undefined ? input.ownerId : undefined,
          value: input.value !== undefined ? new Prisma.Decimal(input.value) : undefined,
          probability: input.probability !== undefined ? input.probability : undefined,
          expectedCloseDate: input.expectedCloseDate !== undefined
            ? (input.expectedCloseDate ? new Date(input.expectedCloseDate) : null)
            : undefined
        },
        include: {
          account: { select: { id: true, name: true, industry: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          pipeline: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true, order: true, probability: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'OPPORTUNITY_UPDATED',
          entity: 'Opportunity',
          entityId: opportunityId,
          oldValue: {
            name: existing.name,
            value: Number(existing.value),
            stageId: existing.stageId,
            ownerId: existing.ownerId
          },
          newValue: {
            name: updated.name,
            value: Number(updated.value),
            stageId: updated.stageId,
            ownerId: updated.ownerId
          }
        }
      });

      return this.formatOpportunity(updated);
    });
  }

  /**
   * Move opportunity to another stage in the SAME pipeline.
   */
  public async changeStage(organizationId: string, currentUserId: string, opportunityId: string, stageId: string) {
    return await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findFirst({
        where: { id: opportunityId, organizationId, deletedAt: null },
        include: { stage: true }
      });

      if (!opportunity) {
        const error: AppError = new Error('Opportunity not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Target stage must belong to the same pipeline and organization
      const targetStage = await tx.pipelineStage.findFirst({
        where: {
          id: stageId,
          pipelineId: opportunity.pipelineId,
          pipeline: { organizationId }
        }
      });

      if (!targetStage) {
        const error: AppError = new Error('Target stage does not belong to this opportunity\'s pipeline');
        error.statusCode = 400;
        error.code = 'INVALID_STAGE_TRANSITION';
        throw error;
      }

      // Synchronize status with stage semantics
      const stageLower = targetStage.name.toLowerCase();
      let newStatus: OpportunityStatus = opportunity.status;
      let newClosedAt: Date | null = opportunity.closedAt;
      let newProb: number = targetStage.probability;

      if (stageLower.includes('won') || targetStage.probability === 1) {
        newStatus = OpportunityStatus.WON;
        newClosedAt = new Date();
        newProb = 1.0;
      } else if (stageLower.includes('lost')) {
        newStatus = OpportunityStatus.LOST;
        newClosedAt = new Date();
        newProb = 0.0;
      } else if (opportunity.status !== OpportunityStatus.OPEN) {
        newStatus = OpportunityStatus.OPEN;
        newClosedAt = null;
      }

      const updated = await tx.opportunity.update({
        where: { id: opportunityId },
        data: {
          stageId: targetStage.id,
          probability: newProb,
          status: newStatus,
          closedAt: newClosedAt
        },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          pipeline: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true, order: true, probability: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'OPPORTUNITY_STAGE_CHANGED',
          entity: 'Opportunity',
          entityId: opportunityId,
          oldValue: {
            stageId: opportunity.stageId,
            stageName: opportunity.stage.name,
            probability: opportunity.probability
          },
          newValue: {
            stageId: targetStage.id,
            stageName: targetStage.name,
            probability: targetStage.probability
          }
        }
      });

      return this.formatOpportunity(updated);
    });
  }

  /**
   * Assign opportunity to a team member in the organization.
   */
  public async assignOpportunity(organizationId: string, currentUserId: string, opportunityId: string, ownerId: string) {
    return await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findFirst({
        where: { id: opportunityId, organizationId, deletedAt: null }
      });

      if (!opportunity) {
        const error: AppError = new Error('Opportunity not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      const newOwner = await tx.user.findFirst({
        where: { id: ownerId, organizationId, isActive: true }
      });

      if (!newOwner) {
        const error: AppError = new Error('Target owner does not exist or is inactive in this organization');
        error.statusCode = 400;
        error.code = 'INVALID_OWNER';
        throw error;
      }

      const updated = await tx.opportunity.update({
        where: { id: opportunityId },
        data: { ownerId: newOwner.id },
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          stage: true
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'OPPORTUNITY_ASSIGNED',
          entity: 'Opportunity',
          entityId: opportunityId,
          oldValue: { ownerId: opportunity.ownerId },
          newValue: { ownerId: newOwner.id, ownerName: newOwner.name }
        }
      });

      return this.formatOpportunity(updated);
    });
  }

  /**
   * Mark Opportunity as WON. Enforces status = WON, closedAt = now, and creates audit event.
   */
  public async winOpportunity(organizationId: string, currentUserId: string, opportunityId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Resolve current deal to verify state and find pipeline Closed Won stage
      const current = await tx.opportunity.findFirst({
        where: { id: opportunityId, organizationId, deletedAt: null }
      });

      if (!current) {
        const error: AppError = new Error('Opportunity not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (current.status === OpportunityStatus.WON) {
        const error: AppError = new Error('Opportunity is already marked as WON');
        error.statusCode = 400;
        error.code = 'ALREADY_WON';
        throw error;
      }

      if (current.status !== OpportunityStatus.OPEN) {
        const error: AppError = new Error(`Opportunity is already marked as ${current.status}`);
        error.statusCode = 400;
        error.code = 'ALREADY_CLOSED';
        throw error;
      }

      // Find Closed Won stage in pipeline if exists
      const wonStage = await tx.pipelineStage.findFirst({
        where: {
          pipelineId: current.pipelineId,
          OR: [
            { name: { contains: 'Won', mode: 'insensitive' } },
            { probability: 1.0 }
          ]
        },
        orderBy: { order: 'desc' }
      });

      // Atomic conditional update ensuring only OPEN opportunities can be transitioned to WON
      const updateResult = await tx.opportunity.updateMany({
        where: {
          id: opportunityId,
          organizationId,
          status: OpportunityStatus.OPEN,
          deletedAt: null
        },
        data: {
          status: OpportunityStatus.WON,
          closedAt: new Date(),
          probability: 1.0,
          ...(wonStage ? { stageId: wonStage.id } : {})
        }
      });

      if (updateResult.count === 0) {
        const error: AppError = new Error('Opportunity is already marked as CLOSED');
        error.statusCode = 400;
        error.code = 'ALREADY_CLOSED';
        throw error;
      }

      const updated = await tx.opportunity.findFirst({
        where: { id: opportunityId },
        include: {
          account: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
          stage: true
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'OPPORTUNITY_WON',
          entity: 'Opportunity',
          entityId: opportunityId,
          oldValue: { status: OpportunityStatus.OPEN },
          newValue: { status: OpportunityStatus.WON, closedAt: updated?.closedAt }
        }
      });

      return this.formatOpportunity(updated);
    });
  }

  /**
   * Mark Opportunity as LOST with reason. Enforces status = LOST, closedAt = now, and creates audit event.
   */
  public async loseOpportunity(
    organizationId: string,
    currentUserId: string,
    opportunityId: string,
    input: LoseOpportunityInput = {}
  ) {
    return await prisma.$transaction(async (tx) => {
      const reason = input.reason || input.lostReason || null;

      // 1. Resolve current deal to verify state and find pipeline Closed Lost stage
      const current = await tx.opportunity.findFirst({
        where: { id: opportunityId, organizationId, deletedAt: null }
      });

      if (!current) {
        const error: AppError = new Error('Opportunity not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (current.status === OpportunityStatus.LOST) {
        const error: AppError = new Error('Opportunity is already marked as LOST');
        error.statusCode = 400;
        error.code = 'ALREADY_LOST';
        throw error;
      }

      if (current.status !== OpportunityStatus.OPEN) {
        const error: AppError = new Error(`Opportunity is already marked as ${current.status}`);
        error.statusCode = 400;
        error.code = 'ALREADY_CLOSED';
        throw error;
      }

      // Find Closed Lost stage in pipeline if exists
      const lostStage = await tx.pipelineStage.findFirst({
        where: {
          pipelineId: current.pipelineId,
          name: { contains: 'Lost', mode: 'insensitive' }
        },
        orderBy: { order: 'desc' }
      });

      // Atomic conditional update ensuring only OPEN opportunities can be transitioned to LOST
      const updateResult = await tx.opportunity.updateMany({
        where: {
          id: opportunityId,
          organizationId,
          status: OpportunityStatus.OPEN,
          deletedAt: null
        },
        data: {
          status: OpportunityStatus.LOST,
          lostReason: reason,
          closedAt: new Date(),
          probability: 0.0,
          ...(lostStage ? { stageId: lostStage.id } : {})
        }
      });

      if (updateResult.count === 0) {
        const error: AppError = new Error('Opportunity is already marked as CLOSED');
        error.statusCode = 400;
        error.code = 'ALREADY_CLOSED';
        throw error;
      }

      const updated = await tx.opportunity.findFirst({
        where: { id: opportunityId },
        include: {
          account: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
          stage: true
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'OPPORTUNITY_LOST',
          entity: 'Opportunity',
          entityId: opportunityId,
          oldValue: { status: OpportunityStatus.OPEN },
          newValue: { status: OpportunityStatus.LOST, lostReason: reason, closedAt: updated?.closedAt }
        }
      });

      return this.formatOpportunity(updated);
    });
  }

  /**
   * Soft-delete opportunity.
   */
  public async deleteOpportunity(organizationId: string, currentUserId: string, opportunityId: string) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, organizationId, deletedAt: null }
    });

    if (!opportunity) {
      const error: AppError = new Error('Opportunity not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { deletedAt: new Date() }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'OPPORTUNITY_DELETED',
        entity: 'Opportunity',
        entityId: opportunityId,
        oldValue: { name: opportunity.name, value: Number(opportunity.value) }
      }
    });

    return { success: true, message: 'Opportunity successfully deleted' };
  }
}

export const opportunitiesService = new OpportunitiesService();
