import { request, API_BASE_URL } from './api';
import {
  Lead,
  GetLeadsQuery,
  GetLeadsResponse,
  CreateLeadInput,
  UpdateLeadInput,
  ConvertLeadInput,
  ConvertLeadResult,
  LeadStatus,
  LeadScoreBreakdown
} from '../types/leads.types';

export class LeadsService {
  public async getLeads(query: GetLeadsQuery = {}): Promise<GetLeadsResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.status) params.append('status', query.status);
    if (query.source) params.append('source', query.source);
    if (query.ownerId) params.append('ownerId', query.ownerId);
    if (query.scoreCategory) params.append('scoreCategory', query.scoreCategory);
    if (query.minScore !== undefined) params.append('minScore', query.minScore.toString());
    if (query.maxScore !== undefined) params.append('maxScore', query.maxScore.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Note: the backend envelope returns data: leads array and meta object
    // request<Lead[]> returns response.data
    // Let's call endpoint and fetch raw response envelope or standard request
    const response = await fetch(`${API_BASE_URL}/leads${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch leads');
    }

    return {
      leads: json.data,
      meta: json.meta
    };
  }

  public async getLeadById(id: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}`);
  }

  public async createLead(input: CreateLeadInput): Promise<Lead> {
    return request<Lead>('/leads', {
      method: 'POST',
      data: input
    });
  }

  public async updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      data: input
    });
  }

  public async assignLead(id: string, ownerId: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}/assign`, {
      method: 'PATCH',
      data: { ownerId }
    });
  }

  public async changeLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    return request<Lead>(`/leads/${id}/status`, {
      method: 'PATCH',
      data: { status }
    });
  }

  public async deleteLead(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/leads/${id}`, {
      method: 'DELETE'
    });
  }

  public async convertLead(id: string, input: ConvertLeadInput = {}): Promise<ConvertLeadResult> {
    return request<ConvertLeadResult>(`/leads/${id}/convert`, {
      method: 'POST',
      data: input
    });
  }

  public async getLeadScore(id: string): Promise<LeadScoreBreakdown> {
    return request<LeadScoreBreakdown>(`/leads/${id}/score`);
  }
}

export const leadsService = new LeadsService();
