import { PrismaClient, Prisma, LeadStatus } from '@prisma/client';
import { AuthContext } from '../../utils/rbac.js';
import {
  ListCampaignsQuery,
  CreateCampaignInput,
  UpdateCampaignInput,
  ListCampaignLeadsQuery
} from './campaigns.validation.js';

const prisma = new PrismaClient();

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export interface CampaignMetrics {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  linkedOpportunitiesCount: number;
  pipelineValue: number;
  wonValue: number;
  attributableOrdersCount: number;
  attributableRevenue: number;
  roi: number | null;
}

export class CampaignsService {
  /**
   * List paginated marketing campaigns with multi-tenancy and filters
   */
  public async getCampaigns(context: AuthContext, query: ListCampaignsQuery) {
    const {
      page,
      limit,
      search,
      status,
      type,
      createdById,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      sortBy,
      sortOrder
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {
      organizationId: context.organizationId
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    if (endDateFrom || endDateTo) {
      where.endDate = {};
      if (endDateFrom) where.endDate.gte = new Date(endDateFrom);
      if (endDateTo) where.endDate.lte = new Date(endDateTo);
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { campaignLeads: true }
          }
        }
      }),
      prisma.campaign.count({ where })
    ]);

    return {
      campaigns: campaigns.map((c) => ({
        ...c,
        budget: c.budget ? Number(c.budget) : null,
        totalLeads: c._count.campaignLeads
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get campaign by ID with derived performance metrics and audit timeline
   */
  public async getCampaignById(context: AuthContext, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: context.organizationId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { campaignLeads: true }
        }
      }
    });

    if (!campaign) {
      const err: AppError = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'CAMPAIGN_NOT_FOUND';
      throw err;
    }

    // Retrieve associated campaign leads to derive exact metrics
    const campaignLeads = await prisma.campaignLead.findMany({
      where: { campaignId: id },
      select: {
        lead: {
          select: {
            id: true,
            status: true,
            convertedAccountId: true,
            convertedContactId: true
          }
        }
      }
    });

    const totalLeads = campaignLeads.length;
    const leadsByStatus: Record<string, number> = {
      NEW: 0,
      QUALIFIED: 0,
      ASSIGNED: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      LOST: 0
    };

    const convertedAccountIds: string[] = [];
    const convertedContactIds: string[] = [];

    for (const cl of campaignLeads) {
      const s = cl.lead.status;
      leadsByStatus[s] = (leadsByStatus[s] || 0) + 1;
      if (cl.lead.convertedAccountId) convertedAccountIds.push(cl.lead.convertedAccountId);
      if (cl.lead.convertedContactId) convertedContactIds.push(cl.lead.convertedContactId);
    }

    const qualifiedLeads =
      (leadsByStatus.QUALIFIED || 0) +
      (leadsByStatus.ASSIGNED || 0) +
      (leadsByStatus.CONTACTED || 0) +
      (leadsByStatus.CONVERTED || 0);

    const convertedLeads = leadsByStatus.CONVERTED || 0;
    const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    // Derived Opportunities and Orders
    let linkedOpportunitiesCount = 0;
    let pipelineValue = 0;
    let wonValue = 0;
    let attributableOrdersCount = 0;
    let attributableRevenue = 0;

    const uniqueAccountIds = [...new Set(convertedAccountIds)];
    const uniqueContactIds = [...new Set(convertedContactIds)];

    if (uniqueAccountIds.length > 0 || uniqueContactIds.length > 0) {
      const orConditions: Prisma.OpportunityWhereInput[] = [];
      if (uniqueAccountIds.length > 0) orConditions.push({ accountId: { in: uniqueAccountIds } });
      if (uniqueContactIds.length > 0) orConditions.push({ contactId: { in: uniqueContactIds } });

      const opportunities = await prisma.opportunity.findMany({
        where: {
          organizationId: context.organizationId,
          deletedAt: null,
          OR: orConditions
        },
        select: {
          id: true,
          value: true,
          status: true,
          orders: {
            where: {
              status: { in: ['CONFIRMED', 'PROCESSING', 'COMPLETED'] }
            },
            select: {
              id: true,
              total: true
            }
          }
        }
      });

      linkedOpportunitiesCount = opportunities.length;

      for (const opp of opportunities) {
        const val = Number(opp.value || 0);
        pipelineValue += val;
        if (opp.status === 'WON') {
          wonValue += val;
        }

        if (opp.orders) {
          for (const ord of opp.orders) {
            attributableOrdersCount++;
            attributableRevenue += Number(ord.total || 0);
          }
        }
      }
    }

    const budget = campaign.budget ? Number(campaign.budget) : 0;
    const roi =
      budget > 0 && wonValue > 0
        ? Number((((wonValue - budget) / budget) * 100).toFixed(1))
        : null;

    // Fetch recent audit logs for this campaign
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId: context.organizationId,
        entity: 'Campaign',
        entityId: id
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    const metrics: CampaignMetrics = {
      totalLeads,
      leadsByStatus,
      qualifiedLeads,
      convertedLeads,
      conversionRate,
      linkedOpportunitiesCount,
      pipelineValue: Number(pipelineValue.toFixed(2)),
      wonValue: Number(wonValue.toFixed(2)),
      attributableOrdersCount,
      attributableRevenue: Number(attributableRevenue.toFixed(2)),
      roi
    };

    return {
      ...campaign,
      budget: campaign.budget ? Number(campaign.budget) : null,
      metrics,
      auditLogs
    };
  }

  /**
   * Create a new campaign with database transaction and audit log
   */
  public async createCampaign(context: AuthContext, data: CreateCampaignInput) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          organizationId: context.organizationId,
          createdById: context.userId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          type: data.type?.trim() || null,
          status: data.status || 'PLANNING',
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          budget: data.budget !== undefined && data.budget !== null ? new Prisma.Decimal(data.budget) : null
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'CAMPAIGN_CREATED',
          entity: 'Campaign',
          entityId: campaign.id,
          metadata: {
            name: campaign.name,
            status: campaign.status,
            type: campaign.type,
            budget: campaign.budget ? Number(campaign.budget) : null
          }
        }
      });

      return {
        ...campaign,
        budget: campaign.budget ? Number(campaign.budget) : null
      };
    });
  }

  /**
   * Update campaign details with transaction and audit log
   */
  public async updateCampaign(context: AuthContext, id: string, data: UpdateCampaignInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.campaign.findFirst({
        where: { id, organizationId: context.organizationId }
      });

      if (!existing) {
        const err: AppError = new Error('Campaign not found');
        err.statusCode = 404;
        err.code = 'CAMPAIGN_NOT_FOUND';
        throw err;
      }

      const updateData: Prisma.CampaignUpdateInput = {};

      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.type !== undefined) updateData.type = data.type?.trim() || null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.budget !== undefined) {
        updateData.budget = data.budget !== null ? new Prisma.Decimal(data.budget) : null;
      }

      const updated = await tx.campaign.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'CAMPAIGN_UPDATED',
          entity: 'Campaign',
          entityId: updated.id,
          metadata: {
            updatedFields: Object.keys(updateData),
            name: updated.name,
            status: updated.status
          }
        }
      });

      return {
        ...updated,
        budget: updated.budget ? Number(updated.budget) : null
      };
    });
  }

  /**
   * Delete campaign with audit log
   */
  public async deleteCampaign(context: AuthContext, id: string) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findFirst({
        where: { id, organizationId: context.organizationId }
      });

      if (!campaign) {
        const err: AppError = new Error('Campaign not found');
        err.statusCode = 404;
        err.code = 'CAMPAIGN_NOT_FOUND';
        throw err;
      }

      await tx.campaign.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'CAMPAIGN_DELETED',
          entity: 'Campaign',
          entityId: id,
          metadata: {
            name: campaign.name,
            deletedAt: new Date().toISOString()
          }
        }
      });

      return { success: true, message: 'Campaign deleted successfully' };
    });
  }

  /**
   * Transition campaign status with audit logging
   */
  public async changeStatus(context: AuthContext, id: string, status: string) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findFirst({
        where: { id, organizationId: context.organizationId }
      });

      if (!campaign) {
        const err: AppError = new Error('Campaign not found');
        err.statusCode = 404;
        err.code = 'CAMPAIGN_NOT_FOUND';
        throw err;
      }

      const updated = await tx.campaign.update({
        where: { id },
        data: { status },
        include: {
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'CAMPAIGN_STATUS_CHANGED',
          entity: 'Campaign',
          entityId: id,
          metadata: {
            previousStatus: campaign.status,
            newStatus: status
          }
        }
      });

      return {
        ...updated,
        budget: updated.budget ? Number(updated.budget) : null
      };
    });
  }

  /**
   * Associate a single lead with campaign with multi-tenancy verification
   */
  public async addLeadToCampaign(context: AuthContext, campaignId: string, leadId: string) {
    const [campaign, lead] = await Promise.all([
      prisma.campaign.findFirst({
        where: { id: campaignId, organizationId: context.organizationId }
      }),
      prisma.lead.findFirst({
        where: { id: leadId, organizationId: context.organizationId, deletedAt: null }
      })
    ]);

    if (!campaign) {
      const err: AppError = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'CAMPAIGN_NOT_FOUND';
      throw err;
    }

    if (!lead) {
      const err: AppError = new Error('Lead not found');
      err.statusCode = 404;
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    // Check if association already exists
    const existing = await prisma.campaignLead.findUnique({
      where: {
        campaignId_leadId: { campaignId, leadId }
      }
    });

    if (existing) {
      return { success: true, message: 'Lead already associated with campaign', item: existing };
    }

    const association = await prisma.campaignLead.create({
      data: { campaignId, leadId }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: 'CAMPAIGN_LEAD_ADDED',
        entity: 'Campaign',
        entityId: campaignId,
        metadata: {
          leadId,
          leadName: `${lead.firstName} ${lead.lastName}`
        }
      }
    });

    return { success: true, message: 'Lead added to campaign successfully', item: association };
  }

  /**
   * Remove lead from campaign
   */
  public async removeLeadFromCampaign(context: AuthContext, campaignId: string, leadId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId: context.organizationId }
    });

    if (!campaign) {
      const err: AppError = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'CAMPAIGN_NOT_FOUND';
      throw err;
    }

    const existing = await prisma.campaignLead.findUnique({
      where: {
        campaignId_leadId: { campaignId, leadId }
      }
    });

    if (!existing) {
      const err: AppError = new Error('Lead association not found');
      err.statusCode = 404;
      err.code = 'ASSOCIATION_NOT_FOUND';
      throw err;
    }

    await prisma.campaignLead.delete({
      where: {
        campaignId_leadId: { campaignId, leadId }
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: 'CAMPAIGN_LEAD_REMOVED',
        entity: 'Campaign',
        entityId: campaignId,
        metadata: { leadId }
      }
    });

    return { success: true, message: 'Lead removed from campaign successfully' };
  }

  /**
   * Bulk associate leads with campaign in database transaction
   */
  public async bulkAddLeadsToCampaign(context: AuthContext, campaignId: string, leadIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findFirst({
        where: { id: campaignId, organizationId: context.organizationId }
      });

      if (!campaign) {
        const err: AppError = new Error('Campaign not found');
        err.statusCode = 404;
        err.code = 'CAMPAIGN_NOT_FOUND';
        throw err;
      }

      // Validate all leads belong to this organization
      const validLeads = await tx.lead.findMany({
        where: {
          id: { in: leadIds },
          organizationId: context.organizationId,
          deletedAt: null
        },
        select: { id: true }
      });

      if (validLeads.length !== leadIds.length) {
        const err: AppError = new Error('One or more leads do not exist or belong to another organization');
        err.statusCode = 400;
        err.code = 'INVALID_LEADS';
        throw err;
      }

      // Insert associations skipping existing duplicates
      const result = await tx.campaignLead.createMany({
        data: leadIds.map((leadId) => ({ campaignId, leadId })),
        skipDuplicates: true
      });

      await tx.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: 'CAMPAIGN_LEADS_BULK_ADDED',
          entity: 'Campaign',
          entityId: campaignId,
          metadata: {
            requestedCount: leadIds.length,
            insertedCount: result.count
          }
        }
      });

      return {
        success: true,
        message: `${result.count} leads associated with campaign successfully`,
        count: result.count
      };
    });
  }

  /**
   * List paginated leads belonging to a specific campaign
   */
  public async getCampaignLeads(context: AuthContext, campaignId: string, query: ListCampaignLeadsQuery) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId: context.organizationId }
    });

    if (!campaign) {
      const err: AppError = new Error('Campaign not found');
      err.statusCode = 404;
      err.code = 'CAMPAIGN_NOT_FOUND';
      throw err;
    }

    const leadWhere: Prisma.LeadWhereInput = {
      organizationId: context.organizationId,
      deletedAt: null
    };

    if (status) {
      leadWhere.status = status as LeadStatus;
    }

    if (search && search.trim()) {
      leadWhere.OR = [
        { firstName: { contains: search.trim(), mode: 'insensitive' } },
        { lastName: { contains: search.trim(), mode: 'insensitive' } },
        { company: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const where: Prisma.CampaignLeadWhereInput = {
      campaignId,
      lead: leadWhere
    };

    const [campaignLeads, total] = await Promise.all([
      prisma.campaignLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
              convertedAccount: { select: { id: true, name: true } },
              convertedContact: { select: { id: true, firstName: true, lastName: true } }
            }
          }
        }
      }),
      prisma.campaignLead.count({ where })
    ]);

    return {
      leads: campaignLeads.map((cl) => ({
        ...cl.lead,
        addedToCampaignAt: cl.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
}

export const campaignsService = new CampaignsService();
