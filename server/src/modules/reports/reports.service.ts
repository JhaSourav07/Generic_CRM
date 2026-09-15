import { PrismaClient, Prisma, LeadStatus, OpportunityStatus, TaskStatus, SupportCaseStatus, ActivityType } from '@prisma/client';
import { AuthContext } from '../../utils/rbac.js';
import { ReportFilterQuery } from './reports.validation.js';

const prisma = new PrismaClient();

/**
 * Utility to safely sanitize strings for CSV export against CSV formula injection.
 * If a cell starts with =, +, -, @, \t, or \r, prefix it with a single quote.
 */
function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // CSV Formula Injection mitigation
  if (/^[\=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes and enclose in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Builds standard date range filter for Prisma DateTime queries.
 */
function buildDateFilter(startDate?: string, endDate?: string): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;

  const filter: Prisma.DateTimeFilter = {};
  if (startDate) {
    filter.gte = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    filter.lte = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
  }
  return filter;
}

export class ReportsService {
  /**
   * 1. OVERVIEW REPORT: High-level KPI summary across all operational domains
   */
  public async getOverviewReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const [
      leadStats,
      opportunityStats,
      wonRevenueAgg,
      pipelineValueAgg,
      taskStats,
      supportStats,
      campaignStats
    ] = await Promise.all([
      // Leads
      prisma.lead.groupBy({
        by: ['status'],
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: dateFilter,
          ...(filters.ownerId ? { ownerId: filters.ownerId } : {})
        },
        _count: true
      }),
      // Opportunities
      prisma.opportunity.groupBy({
        by: ['status'],
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: dateFilter,
          ...(filters.ownerId ? { ownerId: filters.ownerId } : {})
        },
        _count: true
      }),
      // Won Revenue
      prisma.opportunity.aggregate({
        where: {
          organizationId: orgId,
          deletedAt: null,
          status: 'WON',
          createdAt: dateFilter,
          ...(filters.ownerId ? { ownerId: filters.ownerId } : {})
        },
        _sum: { value: true }
      }),
      // Pipeline Value (Open)
      prisma.opportunity.aggregate({
        where: {
          organizationId: orgId,
          deletedAt: null,
          status: 'OPEN',
          createdAt: dateFilter,
          ...(filters.ownerId ? { ownerId: filters.ownerId } : {})
        },
        _sum: { value: true }
      }),
      // Tasks
      prisma.task.groupBy({
        by: ['status'],
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: dateFilter,
          ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {})
        },
        _count: true
      }),
      // Support Cases
      prisma.supportCase.groupBy({
        by: ['status'],
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: dateFilter,
          ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {})
        },
        _count: true
      }),
      // Campaigns
      prisma.campaign.groupBy({
        by: ['status'],
        where: {
          organizationId: orgId,
          createdAt: dateFilter
        },
        _count: true
      })
    ]);

    // Calculate Lead Metrics
    let totalLeads = 0;
    let convertedLeads = 0;
    let qualifiedLeads = 0;
    for (const item of leadStats) {
      totalLeads += item._count;
      if (item.status === 'CONVERTED') convertedLeads += item._count;
      if (['QUALIFIED', 'ASSIGNED', 'CONTACTED', 'CONVERTED'].includes(item.status)) {
        qualifiedLeads += item._count;
      }
    }
    const leadConversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    // Calculate Sales Metrics
    let totalOpportunities = 0;
    let wonCount = 0;
    let lostCount = 0;
    let openCount = 0;
    for (const item of opportunityStats) {
      totalOpportunities += item._count;
      if (item.status === 'WON') wonCount += item._count;
      if (item.status === 'LOST') lostCount += item._count;
      if (item.status === 'OPEN') openCount += item._count;
    }
    const winRate = wonCount + lostCount > 0 ? Number(((wonCount / (wonCount + lostCount)) * 100).toFixed(1)) : 0;
    const pipelineValue = Number(pipelineValueAgg._sum.value || 0);
    const wonRevenue = Number(wonRevenueAgg._sum.value || 0);
    const avgDealSize = wonCount > 0 ? Number((wonRevenue / wonCount).toFixed(2)) : 0;

    // Calculate Task Metrics
    let totalTasks = 0;
    let completedTasks = 0;
    for (const item of taskStats) {
      totalTasks += item._count;
      if (item.status === 'COMPLETED') completedTasks += item._count;
    }
    const taskCompletionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

    // Calculate Support Metrics
    let totalCases = 0;
    let openCases = 0;
    let resolvedCases = 0;
    for (const item of supportStats) {
      totalCases += item._count;
      if (item.status === 'OPEN' || item.status === 'IN_PROGRESS') openCases += item._count;
      if (item.status === 'RESOLVED' || item.status === 'CLOSED') resolvedCases += item._count;
    }
    const supportResolutionRate = totalCases > 0 ? Number(((resolvedCases / totalCases) * 100).toFixed(1)) : 0;

    // Calculate Campaign Metrics
    let totalCampaigns = 0;
    let activeCampaigns = 0;
    for (const item of campaignStats) {
      totalCampaigns += item._count;
      if (item.status === 'ACTIVE') activeCampaigns += item._count;
    }

    return {
      leads: {
        total: totalLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        conversionRate: leadConversionRate
      },
      sales: {
        totalOpportunities,
        openOpportunities: openCount,
        wonOpportunities: wonCount,
        lostOpportunities: lostCount,
        winRate,
        pipelineValue,
        wonRevenue,
        averageDealSize: avgDealSize
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: taskCompletionRate
      },
      support: {
        total: totalCases,
        open: openCases,
        resolved: resolvedCases,
        resolutionRate: supportResolutionRate
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      }
    };
  }

  /**
   * 2. LEAD FUNNEL & ATTRIBUTION REPORT
   */
  public async getLeadReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const where: Prisma.LeadWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      createdAt: dateFilter
    };

    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.status) where.status = filters.status as LeadStatus;
    if (filters.source) where.source = filters.source;

    const [statusGroups, sourceGroups, totalLeads, leadsOverTimeRaw] = await Promise.all([
      // Status breakdown
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      // Source breakdown
      prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: true
      }),
      // Total count
      prisma.lead.count({ where }),
      // Leads created for timeline trend
      prisma.lead.findMany({
        where,
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const statusCounts: Record<string, number> = {
      NEW: 0,
      QUALIFIED: 0,
      ASSIGNED: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      LOST: 0
    };

    for (const s of statusGroups) {
      statusCounts[s.status] = s._count;
    }

    const sourceBreakdown = sourceGroups.map((s) => ({
      source: s.source || 'Direct / Unspecified',
      count: s._count,
      percentage: totalLeads > 0 ? Number(((s._count / totalLeads) * 100).toFixed(1)) : 0
    }));

    // Group leads over time (by Month YYYY-MM)
    const trendMap = new Map<string, number>();
    for (const lead of leadsOverTimeRaw) {
      const monthKey = lead.createdAt.toISOString().substring(0, 7); // YYYY-MM
      trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + 1);
    }

    const timelineTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
      period: date,
      count
    }));

    const convertedCount = statusCounts.CONVERTED || 0;
    const conversionRate = totalLeads > 0 ? Number(((convertedCount / totalLeads) * 100).toFixed(1)) : 0;

    return {
      totalLeads,
      conversionRate,
      statusBreakdown: statusCounts,
      funnel: [
        { stage: 'Total Captured', count: totalLeads, rate: 100 },
        {
          stage: 'Qualified',
          count: (statusCounts.QUALIFIED || 0) + (statusCounts.ASSIGNED || 0) + (statusCounts.CONTACTED || 0) + convertedCount,
          rate: totalLeads > 0 ? Number(((((statusCounts.QUALIFIED || 0) + (statusCounts.ASSIGNED || 0) + (statusCounts.CONTACTED || 0) + convertedCount) / totalLeads) * 100).toFixed(1)) : 0
        },
        {
          stage: 'Contacted',
          count: (statusCounts.CONTACTED || 0) + convertedCount,
          rate: totalLeads > 0 ? Number(((((statusCounts.CONTACTED || 0) + convertedCount) / totalLeads) * 100).toFixed(1)) : 0
        },
        {
          stage: 'Converted to Customer',
          count: convertedCount,
          rate: conversionRate
        }
      ],
      sources: sourceBreakdown,
      timelineTrend
    };
  }

  /**
   * 3. SALES & COMMERCIAL REPORT
   */
  public async getSalesReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const where: Prisma.OpportunityWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      createdAt: dateFilter
    };

    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.pipelineId) where.pipelineId = filters.pipelineId;
    if (filters.status) where.status = filters.status as OpportunityStatus;

    const [
      statusGroups,
      pipelineValueAgg,
      wonRevenueAgg,
      totalCount,
      repsRaw,
      ordersAgg
    ] = await Promise.all([
      prisma.opportunity.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.opportunity.aggregate({
        where: { ...where, status: 'OPEN' },
        _sum: { value: true }
      }),
      prisma.opportunity.aggregate({
        where: { ...where, status: 'WON' },
        _sum: { value: true }
      }),
      prisma.opportunity.count({ where }),
      // Rep breakdown
      prisma.opportunity.findMany({
        where,
        select: {
          id: true,
          value: true,
          status: true,
          owner: { select: { id: true, name: true, email: true } }
        }
      }),
      // Commercial Orders
      prisma.order.aggregate({
        where: {
          organizationId: orgId,
          createdAt: dateFilter,
          status: { in: ['CONFIRMED', 'PROCESSING', 'COMPLETED'] }
        },
        _count: true,
        _sum: { total: true }
      })
    ]);

    let openCount = 0;
    let wonCount = 0;
    let lostCount = 0;

    for (const s of statusGroups) {
      if (s.status === 'OPEN') openCount = s._count;
      if (s.status === 'WON') wonCount = s._count;
      if (s.status === 'LOST') lostCount = s._count;
    }

    const closedCount = wonCount + lostCount;
    const winRate = closedCount > 0 ? Number(((wonCount / closedCount) * 100).toFixed(1)) : 0;
    const pipelineValue = Number(pipelineValueAgg._sum.value || 0);
    const wonRevenue = Number(wonRevenueAgg._sum.value || 0);
    const avgDealSize = wonCount > 0 ? Number((wonRevenue / wonCount).toFixed(2)) : 0;

    // Aggregate rep performance
    const repMap = new Map<string, { id: string; name: string; email: string; totalDeals: number; wonDeals: number; wonValue: number }>();
    for (const opp of repsRaw) {
      const repKey = opp.owner?.id || 'unassigned';
      const current = repMap.get(repKey) || {
        id: repKey,
        name: opp.owner?.name || 'Unassigned',
        email: opp.owner?.email || '',
        totalDeals: 0,
        wonDeals: 0,
        wonValue: 0
      };
      current.totalDeals += 1;
      if (opp.status === 'WON') {
        current.wonDeals += 1;
        current.wonValue += Number(opp.value || 0);
      }
      repMap.set(repKey, current);
    }

    const salesByRep = Array.from(repMap.values()).map((r) => ({
      ...r,
      wonValue: Number(r.wonValue.toFixed(2)),
      winRate: r.totalDeals > 0 ? Number(((r.wonDeals / r.totalDeals) * 100).toFixed(1)) : 0
    }));

    return {
      totalOpportunities: totalCount,
      openOpportunities: openCount,
      wonOpportunities: wonCount,
      lostOpportunities: lostCount,
      winRate,
      pipelineValue,
      wonRevenue,
      averageDealSize: avgDealSize,
      orders: {
        totalOrders: ordersAgg._count,
        totalRevenue: Number(ordersAgg._sum.total || 0)
      },
      salesByRep
    };
  }

  /**
   * 4. PIPELINE BREAKDOWN REPORT
   */
  public async getPipelineReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    // Fetch active pipeline stages
    const pipelines = await prisma.pipeline.findMany({
      where: {
        organizationId: orgId,
        ...(filters.pipelineId ? { id: filters.pipelineId } : {})
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            opportunities: {
              where: {
                organizationId: orgId,
                deletedAt: null,
                createdAt: dateFilter,
                ...(filters.ownerId ? { ownerId: filters.ownerId } : {})
              },
              select: {
                id: true,
                value: true,
                probability: true,
                status: true
              }
            }
          }
        }
      }
    });

    const stagesBreakdown: any[] = [];
    let grandPipelineValue = 0;
    let grandWeightedValue = 0;
    let grandDealCount = 0;

    for (const pipeline of pipelines) {
      for (const stage of pipeline.stages) {
        let stageValue = 0;
        let weightedValue = 0;
        let dealCount = 0;

        for (const opp of stage.opportunities) {
          const val = Number(opp.value || 0);
          const prob = typeof opp.probability === 'number' ? opp.probability : stage.probability;
          stageValue += val;
          weightedValue += val * (prob / 100);
          dealCount += 1;
        }

        grandPipelineValue += stageValue;
        grandWeightedValue += weightedValue;
        grandDealCount += dealCount;

        stagesBreakdown.push({
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          stageId: stage.id,
          stageName: stage.name,
          order: stage.order,
          probability: stage.probability,
          dealCount,
          totalValue: Number(stageValue.toFixed(2)),
          weightedValue: Number(weightedValue.toFixed(2))
        });
      }
    }

    return {
      totalPipelineValue: Number(grandPipelineValue.toFixed(2)),
      totalWeightedValue: Number(grandWeightedValue.toFixed(2)),
      totalDeals: grandDealCount,
      stages: stagesBreakdown
    };
  }

  /**
   * 5. TEAM ACTIVITY REPORT
   */
  public async getActivityReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const where: Prisma.ActivityWhereInput = {
      organizationId: orgId,
      createdAt: dateFilter
    };

    if (filters.createdById) where.createdById = filters.createdById;
    if (filters.type) where.type = filters.type as ActivityType;

    const [typeGroups, totalActivities, activitiesRaw] = await Promise.all([
      prisma.activity.groupBy({
        by: ['type'],
        where,
        _count: true
      }),
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          type: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const typeBreakdown: Record<string, number> = {
      CALL: 0,
      MEETING: 0,
      EMAIL: 0,
      NOTE: 0,
      OTHER: 0
    };

    for (const t of typeGroups) {
      typeBreakdown[t.type] = t._count;
    }

    // User breakdown
    const userMap = new Map<string, { id: string; name: string; email: string; count: number }>();
    const timelineMap = new Map<string, number>();

    for (const act of activitiesRaw) {
      // Rep aggregation
      const userKey = act.createdBy.id;
      const u = userMap.get(userKey) || {
        id: userKey,
        name: act.createdBy.name,
        email: act.createdBy.email,
        count: 0
      };
      u.count += 1;
      userMap.set(userKey, u);

      // Timeline aggregation
      const dateKey = act.createdAt.toISOString().substring(0, 10);
      timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
    }

    return {
      totalActivities,
      byType: typeBreakdown,
      byUser: Array.from(userMap.values()),
      timelineTrend: Array.from(timelineMap.entries()).map(([date, count]) => ({
        date,
        count
      }))
    };
  }

  /**
   * 6. TASK PERFORMANCE REPORT
   */
  public async getTaskReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
    const now = new Date();

    const where: Prisma.TaskWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      createdAt: dateFilter
    };

    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.status) where.status = filters.status as TaskStatus;

    const [statusGroups, priorityGroups, totalTasks, overdueCount, tasksRaw] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      prisma.task.count({ where }),
      prisma.task.count({
        where: {
          ...where,
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      }),
      prisma.task.findMany({
        where,
        select: {
          id: true,
          status: true,
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    const statusCounts: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    for (const s of statusGroups) {
      statusCounts[s.status] = s._count;
    }

    const priorityCounts: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };
    for (const p of priorityGroups) {
      priorityCounts[p.priority] = p._count;
    }

    const completed = statusCounts.COMPLETED || 0;
    const completionRate = totalTasks > 0 ? Number(((completed / totalTasks) * 100).toFixed(1)) : 0;

    // Tasks by assignee
    const userMap = new Map<string, { id: string; name: string; email: string; total: number; completed: number }>();
    for (const task of tasksRaw) {
      const uKey = task.assignedTo?.id || 'unassigned';
      const u = userMap.get(uKey) || {
        id: uKey,
        name: task.assignedTo?.name || 'Unassigned',
        email: task.assignedTo?.email || '',
        total: 0,
        completed: 0
      };
      u.total += 1;
      if (task.status === 'COMPLETED') u.completed += 1;
      userMap.set(uKey, u);
    }

    return {
      totalTasks,
      completedTasks: completed,
      overdueTasks: overdueCount,
      completionRate,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      byAssignee: Array.from(userMap.values())
    };
  }

  /**
   * 7. SUPPORT RESOLUTION REPORT
   */
  public async getSupportReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const where: Prisma.SupportCaseWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      createdAt: dateFilter
    };

    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.status) where.status = filters.status as SupportCaseStatus;

    const [statusGroups, priorityGroups, totalCases, casesRaw] = await Promise.all([
      prisma.supportCase.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.supportCase.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      prisma.supportCase.count({ where }),
      prisma.supportCase.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    const statusCounts: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    for (const s of statusGroups) {
      statusCounts[s.status] = s._count;
    }

    const priorityCounts: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };
    for (const p of priorityGroups) {
      priorityCounts[p.priority] = p._count;
    }

    const resolved = (statusCounts.RESOLVED || 0) + (statusCounts.CLOSED || 0);
    const resolutionRate = totalCases > 0 ? Number(((resolved / totalCases) * 100).toFixed(1)) : 0;

    // Calculate Average Resolution Hours
    let totalResolutionHours = 0;
    let resolvedCasesCount = 0;
    const assigneeMap = new Map<string, { id: string; name: string; total: number; resolved: number }>();

    for (const c of casesRaw) {
      if (c.resolvedAt) {
        const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
        if (diffMs > 0) {
          totalResolutionHours += diffMs / (1000 * 60 * 60);
          resolvedCasesCount += 1;
        }
      }

      const aKey = c.assignedTo?.id || 'unassigned';
      const a = assigneeMap.get(aKey) || {
        id: aKey,
        name: c.assignedTo?.name || 'Unassigned',
        total: 0,
        resolved: 0
      };
      a.total += 1;
      if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
        a.resolved += 1;
      }
      assigneeMap.set(aKey, a);
    }

    const avgResolutionHours = resolvedCasesCount > 0 ? Number((totalResolutionHours / resolvedCasesCount).toFixed(1)) : null;

    return {
      totalCases,
      resolvedCases: resolved,
      openCases: (statusCounts.OPEN || 0) + (statusCounts.IN_PROGRESS || 0),
      resolutionRate,
      averageResolutionHours: avgResolutionHours,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      byAssignee: Array.from(assigneeMap.values())
    };
  }

  /**
   * 8. CAMPAIGN PERFORMANCE REPORT
   */
  public async getCampaignReport(context: AuthContext, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const where: Prisma.CampaignWhereInput = {
      organizationId: orgId,
      createdAt: dateFilter
    };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        campaignLeads: {
          select: {
            lead: {
              select: {
                id: true,
                status: true,
                convertedAccountId: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalBudget = 0;
    let totalLeads = 0;
    let totalConverted = 0;

    const campaignSummaries = campaigns.map((c) => {
      const budget = c.budget ? Number(c.budget) : 0;
      totalBudget += budget;

      const leadsCount = c.campaignLeads.length;
      totalLeads += leadsCount;

      const converted = c.campaignLeads.filter((cl) => cl.lead.status === 'CONVERTED').length;
      totalConverted += converted;

      const convRate = leadsCount > 0 ? Number(((converted / leadsCount) * 100).toFixed(1)) : 0;

      return {
        id: c.id,
        name: c.name,
        type: c.type || 'Standard',
        status: c.status,
        budget,
        startDate: c.startDate,
        endDate: c.endDate,
        leadsCount,
        convertedLeadsCount: converted,
        conversionRate: convRate,
        createdBy: c.createdBy
      };
    });

    const overallConversionRate = totalLeads > 0 ? Number(((totalConverted / totalLeads) * 100).toFixed(1)) : 0;

    return {
      totalCampaigns: campaigns.length,
      totalBudget: Number(totalBudget.toFixed(2)),
      totalLeads,
      totalConvertedLeads: totalConverted,
      overallConversionRate,
      campaigns: campaignSummaries
    };
  }

  /**
   * 9. CSV EXPORT ENGINE: Multi-tenant server-side CSV streaming with formula injection protection
   */
  public async exportReportToCsv(context: AuthContext, reportType: string, filters: ReportFilterQuery) {
    const orgId = context.organizationId;
    const timestamp = new Date().toISOString().substring(0, 10);
    let filename = `vynexa-${reportType}-report-${timestamp}.csv`;
    let headers: string[] = [];
    let rows: string[][] = [];

    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);

    switch (reportType) {
      case 'leads': {
        const leads = await prisma.lead.findMany({
          where: {
            organizationId: orgId,
            deletedAt: null,
            createdAt: dateFilter,
            ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
            ...(filters.status ? { status: filters.status as LeadStatus } : {})
          },
          include: {
            owner: { select: { name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5000
        });

        headers = ['ID', 'First Name', 'Last Name', 'Company', 'Email', 'Phone', 'Source', 'Status', 'Score', 'Owner', 'Created Date'];
        rows = leads.map((l) => [
          l.id,
          l.firstName,
          l.lastName,
          l.company || '',
          l.email || '',
          l.phone || '',
          l.source || '',
          l.status,
          String(l.score),
          l.owner?.name || 'Unassigned',
          l.createdAt.toISOString()
        ]);
        break;
      }

      case 'sales': {
        const opportunities = await prisma.opportunity.findMany({
          where: {
            organizationId: orgId,
            deletedAt: null,
            createdAt: dateFilter,
            ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
            ...(filters.pipelineId ? { pipelineId: filters.pipelineId } : {})
          },
          include: {
            stage: { select: { name: true } },
            owner: { select: { name: true } },
            account: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5000
        });

        headers = ['ID', 'Deal Name', 'Account', 'Stage', 'Value (USD)', 'Probability (%)', 'Status', 'Owner', 'Expected Close', 'Created Date'];
        rows = opportunities.map((o) => [
          o.id,
          o.name,
          o.account?.name || '',
          o.stage?.name || '',
          String(o.value),
          String(o.probability),
          o.status,
          o.owner?.name || 'Unassigned',
          o.expectedCloseDate ? o.expectedCloseDate.toISOString().substring(0, 10) : '',
          o.createdAt.toISOString()
        ]);
        break;
      }

      case 'pipeline': {
        const report = await this.getPipelineReport(context, filters);
        headers = ['Pipeline', 'Stage', 'Order', 'Probability (%)', 'Deal Count', 'Stage Value (USD)', 'Weighted Value (USD)'];
        rows = report.stages.map((s) => [
          s.pipelineName,
          s.stageName,
          String(s.order),
          String(s.probability),
          String(s.dealCount),
          String(s.totalValue),
          String(s.weightedValue)
        ]);
        break;
      }

      case 'activities': {
        const activities = await prisma.activity.findMany({
          where: {
            organizationId: orgId,
            createdAt: dateFilter,
            ...(filters.createdById ? { createdById: filters.createdById } : {}),
            ...(filters.type ? { type: filters.type as ActivityType } : {})
          },
          include: {
            createdBy: { select: { name: true, email: true } },
            account: { select: { name: true } },
            lead: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5000
        });

        headers = ['ID', 'Type', 'Subject', 'Created By', 'Related Customer', 'Related Lead', 'Activity Date'];
        rows = activities.map((a) => [
          a.id,
          a.type,
          a.subject,
          a.createdBy.name,
          a.account?.name || '',
          a.lead ? `${a.lead.firstName} ${a.lead.lastName}` : '',
          a.activityDate.toISOString()
        ]);
        break;
      }

      case 'tasks': {
        const tasks = await prisma.task.findMany({
          where: {
            organizationId: orgId,
            deletedAt: null,
            createdAt: dateFilter,
            ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {})
          },
          include: {
            assignedTo: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5000
        });

        headers = ['ID', 'Title', 'Priority', 'Status', 'Assignee', 'Due Date', 'Created Date'];
        rows = tasks.map((t) => [
          t.id,
          t.title,
          t.priority,
          t.status,
          t.assignedTo?.name || 'Unassigned',
          t.dueDate ? t.dueDate.toISOString().substring(0, 10) : '',
          t.createdAt.toISOString()
        ]);
        break;
      }

      case 'support': {
        const cases = await prisma.supportCase.findMany({
          where: {
            organizationId: orgId,
            deletedAt: null,
            createdAt: dateFilter,
            ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {})
          },
          include: {
            assignedTo: { select: { name: true } },
            account: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5000
        });

        headers = ['Case ID', 'Subject', 'Account', 'Priority', 'Status', 'Assignee', 'Resolved Date', 'Created Date'];
        rows = cases.map((c) => [
          `CASE-${c.id.substring(0, 8).toUpperCase()}`,
          c.subject,
          c.account?.name || '',
          c.priority,
          c.status,
          c.assignedTo?.name || 'Unassigned',
          c.resolvedAt ? c.resolvedAt.toISOString() : '',
          c.createdAt.toISOString()
        ]);
        break;
      }

      case 'campaigns': {
        const report = await this.getCampaignReport(context, filters);
        headers = ['Campaign Name', 'Type', 'Status', 'Budget (USD)', 'Start Date', 'End Date', 'Leads Count', 'Converted Leads', 'Conversion Rate (%)', 'Creator'];
        rows = report.campaigns.map((c) => [
          c.name,
          c.type,
          c.status,
          String(c.budget),
          c.startDate ? new Date(c.startDate).toISOString().substring(0, 10) : '',
          c.endDate ? new Date(c.endDate).toISOString().substring(0, 10) : '',
          String(c.leadsCount),
          String(c.convertedLeadsCount),
          String(c.conversionRate),
          c.createdBy?.name || ''
        ]);
        break;
      }

      default: {
        headers = ['Metric', 'Value'];
        rows = [['Report Type', reportType], ['Generated At', new Date().toISOString()]];
      }
    }

    // Construct sanitized CSV string
    const csvLines: string[] = [];
    csvLines.push(headers.map((h) => sanitizeCsvCell(h)).join(','));
    for (const row of rows) {
      csvLines.push(row.map((cell) => sanitizeCsvCell(cell)).join(','));
    }

    const csvContent = csvLines.join('\r\n');

    // Audit export action
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId: context.userId,
        action: 'REPORT_EXPORTED',
        entity: 'Report',
        entityId: reportType,
        metadata: {
          reportType,
          rowCount: rows.length,
          filename
        }
      }
    });

    return {
      filename,
      csvContent
    };
  }
}

export const reportsService = new ReportsService();
