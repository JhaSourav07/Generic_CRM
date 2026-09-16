import { prisma } from '../../config/prisma.js';


export interface DashboardMetrics {
  totalLeads: number;
  activeOpportunities: number;
  pipelineValue: number;
  openTasks: number;
  wonOpportunities: number;
  overdueTasks: number;
  myOpenTasks?: number;
  myOverdueTasks?: number;
  leadScores?: {
    hot: number;
    warm: number;
    cool: number;
    cold: number;
  };
}

export interface PipelineStageOverview {
  id: string;
  name: string;
  order: number;
  count: number;
  totalValue: number;
  percentage: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  subject: string;
  description?: string | null;
  activityDate: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  relatedTo?: {
    type: 'LEAD' | 'ACCOUNT' | 'CONTACT' | 'OPPORTUNITY';
    id: string;
    name: string;
  } | null;
}

export interface TaskOverviewItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string | null;
  isOverdue: boolean;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  relatedEntityName?: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardOverviewData {
  organization: {
    id: string;
    name: string;
    currency: string;
    timezone: string;
  };
  metrics: DashboardMetrics;
  pipeline: PipelineStageOverview[];
  recentActivities: RecentActivityItem[];
  tasks: TaskOverviewItem[];
  myTasks: TaskOverviewItem[];
  notifications: {
    unreadCount: number;
    items: NotificationItem[];
  };
}

export class DashboardService {
  /**
   * Aggregate and fetch full authenticated workspace dashboard data for tenant
   */
  public async getDashboardOverview(organizationId: string, userId: string, role?: string): Promise<DashboardOverviewData> {
    const now = new Date();

    // Independent database read queries executed in parallel
    const [
      org,
      totalLeads,
      hotLeads,
      warmLeads,
      coolLeads,
      coldLeads,
      activeOpportunities,
      pipelineValueAgg,
      openTasks,
      wonOpportunities,
      overdueTasks,
      pipelineStages,
      recentActivitiesRaw,
      tasksRaw,
      myTasksRaw,
      myOpenTasks,
      myOverdueTasks,
      notificationsRaw,
      unreadCount
    ] = await Promise.all([
      // 1. Organization Metadata
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, currency: true, timezone: true }
      }),

      // 2. Metric Counts
      prisma.lead.count({
        where: { organizationId, deletedAt: null }
      }),

      prisma.lead.count({
        where: { organizationId, scoreCategory: 'HOT', deletedAt: null }
      }),
      prisma.lead.count({
        where: { organizationId, scoreCategory: 'WARM', deletedAt: null }
      }),
      prisma.lead.count({
        where: { organizationId, scoreCategory: 'COOL', deletedAt: null }
      }),
      prisma.lead.count({
        where: { organizationId, scoreCategory: 'COLD', deletedAt: null }
      }),

      prisma.opportunity.count({
        where: { organizationId, status: 'OPEN', deletedAt: null }
      }),

      prisma.opportunity.aggregate({
        _sum: { value: true },
        where: { organizationId, status: 'OPEN', deletedAt: null }
      }),

      prisma.task.count({
        where: { organizationId, status: { in: ['TODO', 'IN_PROGRESS'] }, deletedAt: null }
      }),

      prisma.opportunity.count({
        where: { organizationId, status: 'WON', deletedAt: null }
      }),

      prisma.task.count({
        where: {
          organizationId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: now },
          deletedAt: null
        }
      }),

      // 3. Pipeline Stages & Opportunities
      prisma.pipelineStage.findMany({
        where: {
          pipeline: { organizationId }
        },
        include: {
          opportunities: {
            where: { organizationId, deletedAt: null, status: 'OPEN' },
            select: { id: true, value: true }
          }
        },
        orderBy: { order: 'asc' }
      }),

      // 4. Recent Activities
      prisma.activity.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { activityDate: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true, company: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          opportunity: { select: { id: true, name: true } }
        }
      }),

      // 5. Tasks Overview (All open tasks in organization)
      prisma.task.findMany({
        where: {
          organizationId,
          deletedAt: null,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          ...(role === 'SALES_REPRESENTATIVE' ? { assignedToId: userId } : {})
        },
        take: 8,
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true } },
          account: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } }
        }
      }),

      // 5b. My Tasks (Strictly assigned to current user)
      prisma.task.findMany({
        where: {
          organizationId,
          assignedToId: userId,
          deletedAt: null,
          status: { in: ['TODO', 'IN_PROGRESS'] }
        },
        take: 8,
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, firstName: true, lastName: true } },
          account: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } }
        }
      }),

      // 5c. My Open Tasks Count
      prisma.task.count({
        where: {
          organizationId,
          assignedToId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          deletedAt: null
        }
      }),

      // 5d. My Overdue Tasks Count
      prisma.task.count({
        where: {
          organizationId,
          assignedToId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: now },
          deletedAt: null
        }
      }),

      // 6. User Notifications
      prisma.notification.findMany({
        where: { organizationId, userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, title: true, message: true, isRead: true, createdAt: true }
      }),

      prisma.notification.count({
        where: { organizationId, userId, isRead: false }
      })
    ]);

    const totalPipelineValue = Number(pipelineValueAgg._sum.value || 0);

    // Format Pipeline Stages Overview
    const pipeline: PipelineStageOverview[] = pipelineStages.map((stage) => {
      const stageTotal = stage.opportunities.reduce((acc, opp) => acc + Number(opp.value), 0);
      const percentage = totalPipelineValue > 0 ? Math.round((stageTotal / totalPipelineValue) * 100) : 0;

      return {
        id: stage.id,
        name: stage.name,
        order: stage.order,
        count: stage.opportunities.length,
        totalValue: stageTotal,
        percentage
      };
    });

    // Format Recent Activities Feed
    const recentActivities: RecentActivityItem[] = recentActivitiesRaw.map((act) => {
      let relatedTo: RecentActivityItem['relatedTo'] = null;

      if (act.lead) {
        relatedTo = {
          type: 'LEAD',
          id: act.lead.id,
          name: act.lead.company || `${act.lead.firstName} ${act.lead.lastName}`
        };
      } else if (act.account) {
        relatedTo = { type: 'ACCOUNT', id: act.account.id, name: act.account.name };
      } else if (act.contact) {
        relatedTo = { type: 'CONTACT', id: act.contact.id, name: `${act.contact.firstName} ${act.contact.lastName}` };
      } else if (act.opportunity) {
        relatedTo = { type: 'OPPORTUNITY', id: act.opportunity.id, name: act.opportunity.name };
      }

      return {
        id: act.id,
        type: act.type,
        subject: act.subject,
        description: act.description,
        activityDate: act.activityDate.toISOString(),
        createdBy: act.createdBy,
        relatedTo
      };
    });

    // Format Task Helper
    const formatTask = (t: any): TaskOverviewItem => {
      let relatedEntityName: string | null = null;
      if (t.account) relatedEntityName = t.account.name;
      else if (t.lead) relatedEntityName = `${t.lead.firstName} ${t.lead.lastName}`;
      else if (t.opportunity) relatedEntityName = t.opportunity.name;

      const isOverdue = t.dueDate ? new Date(t.dueDate) < now : false;

      return {
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        isOverdue,
        assignedTo: t.assignedTo,
        relatedEntityName
      };
    };

    // Format Tasks
    const tasks: TaskOverviewItem[] = tasksRaw.map(formatTask);
    const myTasks: TaskOverviewItem[] = myTasksRaw.map(formatTask);

    // Format Notifications
    const notificationsList: NotificationItem[] = notificationsRaw.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString()
    }));

    return {
      organization: org
        ? {
            id: org.id,
            name: org.name,
            currency: org.currency,
            timezone: org.timezone
          }
        : {
            id: organizationId,
            name: 'Organization',
            currency: 'USD',
            timezone: 'UTC'
          },
      metrics: {
        totalLeads,
        activeOpportunities,
        pipelineValue: totalPipelineValue,
        openTasks,
        wonOpportunities,
        overdueTasks,
        myOpenTasks,
        myOverdueTasks,
        leadScores: {
          hot: hotLeads,
          warm: warmLeads,
          cool: coolLeads,
          cold: coldLeads
        }
      },
      pipeline,
      recentActivities,
      tasks,
      myTasks,
      notifications: {
        unreadCount,
        items: notificationsList
      }
    };
  }
}

export const dashboardService = new DashboardService();
