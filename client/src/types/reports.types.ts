export type ReportType =
  | 'overview'
  | 'leads'
  | 'sales'
  | 'pipeline'
  | 'activities'
  | 'tasks'
  | 'support'
  | 'campaigns';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  assignedToId?: string;
  createdById?: string;
  status?: string;
  priority?: string;
  source?: string;
  type?: string;
  pipelineId?: string;
}

export interface OverviewReportData {
  leads: {
    total: number;
    qualified: number;
    converted: number;
    conversionRate: number;
  };
  sales: {
    totalOpportunities: number;
    openOpportunities: number;
    wonOpportunities: number;
    lostOpportunities: number;
    winRate: number;
    pipelineValue: number;
    wonRevenue: number;
    averageDealSize: number;
  };
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
  support: {
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
}

export interface LeadReportData {
  totalLeads: number;
  byStatus: Array<{ status: string; count: number; percentage: number }>;
  bySource: Array<{ source: string; count: number; percentage: number }>;
  trend: Array<{ date: string; count: number }>;
  conversionRate: number;
}

export interface SalesReportData {
  totalOpportunities: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
  winRate: number;
  pipelineValue: number;
  wonRevenue: number;
  averageDealSize: number;
  byRep: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalDeals: number;
    wonDeals: number;
    wonRevenue: number;
  }>;
}

export interface PipelineReportData {
  pipeline: {
    id: string;
    name: string;
  } | null;
  totalDeals: number;
  totalPipelineValue: number;
  totalWeightedValue: number;
  stages: Array<{
    stageId: string;
    stageName: string;
    stageOrder: number;
    dealCount: number;
    totalValue: number;
    probability: number;
    weightedValue: number;
  }>;
}

export interface ActivityReportData {
  totalActivities: number;
  byType: Array<{ type: string; count: number; percentage: number }>;
  byUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    count: number;
  }>;
}

export interface TaskReportData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
}

export interface SupportReportData {
  totalCases: number;
  openCases: number;
  resolvedCases: number;
  resolutionRate: number;
  averageResolutionHours: number | null;
  byPriority: Array<{ priority: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

export interface CampaignReportData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalAttributableRevenue: number;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    type: string | null;
    budget: number | null;
    leadCount: number;
    convertedLeadCount: number;
    conversionRate: number;
    pipelineValue: number;
    wonRevenue: number;
    roi: number | null;
  }>;
}
