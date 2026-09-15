import { request } from './api';
import {
  SupportCase,
  ListSupportCasesParams,
  CreateSupportCaseInput,
  UpdateSupportCaseInput
} from '../types/support.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface GetSupportCasesResponse {
  cases: SupportCase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class SupportCasesService {
  public async getCases(params: ListSupportCasesParams = {}): Promise<GetSupportCasesResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.assignedToId) searchParams.append('assignedToId', params.assignedToId);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/support-cases${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch support cases');
    }

    return {
      cases: json.data || [],
      pagination: json.meta || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getCaseById(id: string): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}`);
  }

  public async createCase(payload: CreateSupportCaseInput): Promise<SupportCase> {
    return request<SupportCase>('/support-cases', {
      method: 'POST',
      data: payload
    });
  }

  public async updateCase(id: string, payload: UpdateSupportCaseInput): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}`, {
      method: 'PATCH',
      data: payload
    });
  }

  public async assignCase(id: string, assignedToId: string | null): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}/assign`, {
      method: 'PATCH',
      data: { assignedToId }
    });
  }

  public async changeStatus(id: string, status: string): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}/status`, {
      method: 'PATCH',
      data: { status }
    });
  }

  public async resolveCase(id: string, resolution: string): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}/resolve`, {
      method: 'POST',
      data: { resolution }
    });
  }

  public async closeCase(id: string, notes?: string): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}/close`, {
      method: 'POST',
      data: { notes }
    });
  }

  public async reopenCase(id: string): Promise<SupportCase> {
    return request<SupportCase>(`/support-cases/${id}/reopen`, {
      method: 'POST'
    });
  }

  public async deleteCase(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/support-cases/${id}`, {
      method: 'DELETE'
    });
  }
}

export const supportCasesService = new SupportCasesService();
