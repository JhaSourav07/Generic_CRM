export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskUser {
  id: string;
  name: string;
  email: string;
}

export interface TaskEntityRef {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
}

export interface Task {
  id: string;
  organizationId: string;
  assignedToId: string | null;
  createdById: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  leadId: string | null;
  accountId: string | null;
  contactId: string | null;
  opportunityId: string | null;
  createdAt: string;
  updatedAt: string;

  assignedTo?: TaskUser | null;
  createdBy?: TaskUser;
  lead?: TaskEntityRef | null;
  account?: TaskEntityRef | null;
  contact?: TaskEntityRef | null;
  opportunity?: TaskEntityRef | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedToId?: string | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedToId?: string | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
}

export interface GetTasksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  overdue?: boolean;
  dueToday?: boolean;
  upcoming?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'dueDate' | 'priority' | 'status' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskSummary {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  completedCount: number;
}

export interface GetTasksResponse {
  tasks: Task[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: TaskSummary;
}
