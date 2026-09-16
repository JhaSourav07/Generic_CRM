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
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE' | 'OTHER';
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  myTasks?: TaskOverviewItem[];
  notifications: {
    unreadCount: number;
    items: NotificationItem[];
  };
}
