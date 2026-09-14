import { request } from './api';
import {
  Activity,
  CreateActivityPayload,
  UpdateActivityPayload,
  GetActivitiesParams,
  GetActivitiesResponse
} from '../types/activities.types';

export class ActivitiesService {
  public async getActivities(params: GetActivitiesParams = {}): Promise<GetActivitiesResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.type) searchParams.append('type', params.type);
    if (params.createdById) searchParams.append('createdById', params.createdById);
    if (params.leadId) searchParams.append('leadId', params.leadId);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`http://localhost:5000/api/activities${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch activities');
    }

    return {
      activities: json.data,
      meta: json.meta
    };
  }

  public async getActivityById(id: string): Promise<Activity> {
    return request<Activity>(`/activities/${id}`);
  }

  public async createActivity(payload: CreateActivityPayload): Promise<Activity> {
    return request<Activity>('/activities', {
      method: 'POST',
      data: payload
    });
  }

  public async updateActivity(id: string, payload: UpdateActivityPayload): Promise<Activity> {
    return request<Activity>(`/activities/${id}`, {
      method: 'PATCH',
      data: payload
    });
  }

  public async deleteActivity(id: string): Promise<{ id: string; success: boolean }> {
    return request<{ id: string; success: boolean }>(`/activities/${id}`, {
      method: 'DELETE'
    });
  }

  public async getTimeline(params: {
    leadId?: string;
    accountId?: string;
    contactId?: string;
    opportunityId?: string;
    limit?: number;
  }): Promise<Activity[]> {
    const searchParams = new URLSearchParams();
    if (params.leadId) searchParams.append('leadId', params.leadId);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Activity[]>(`/activities/timeline${queryString}`);
  }
}

export const activitiesService = new ActivitiesService();
