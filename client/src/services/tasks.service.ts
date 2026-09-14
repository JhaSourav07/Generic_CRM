import { request } from './api';
import {
  Task,
  TaskStatus,
  CreateTaskPayload,
  UpdateTaskPayload,
  GetTasksParams,
  GetTasksResponse
} from '../types/tasks.types';

export class TasksService {
  public async getTasks(params: GetTasksParams = {}): Promise<GetTasksResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.assignedToId) searchParams.append('assignedToId', params.assignedToId);
    if (params.leadId) searchParams.append('leadId', params.leadId);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId);
    if (params.overdue !== undefined) searchParams.append('overdue', params.overdue.toString());
    if (params.dueToday !== undefined) searchParams.append('dueToday', params.dueToday.toString());
    if (params.upcoming !== undefined) searchParams.append('upcoming', params.upcoming.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`http://localhost:5000/api/tasks${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch tasks');
    }

    return {
      tasks: json.data,
      meta: json.meta,
      summary: json.summary || {
        openCount: 0,
        overdueCount: 0,
        dueTodayCount: 0,
        completedCount: 0
      }
    };
  }

  public async getTaskById(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}`);
  }

  public async createTask(payload: CreateTaskPayload): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      data: payload
    });
  }

  public async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      data: payload
    });
  }

  public async changeStatus(id: string, status: TaskStatus): Promise<Task> {
    return request<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      data: { status }
    });
  }

  public async assignTask(id: string, assignedToId: string | null): Promise<Task> {
    return request<Task>(`/tasks/${id}/assign`, {
      method: 'PATCH',
      data: { assignedToId }
    });
  }

  public async completeTask(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}/complete`, {
      method: 'PATCH'
    });
  }

  public async deleteTask(id: string): Promise<{ id: string; success: boolean }> {
    return request<{ id: string; success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }
}

export const tasksService = new TasksService();
