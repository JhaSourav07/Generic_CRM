import { request } from './api';
import {
  Campaign,
  CampaignStatus,
  CampaignLeadItem,
  ListCampaignsParams,
  CreateCampaignInput,
  UpdateCampaignInput
} from '../types/campaigns.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface GetCampaignsResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetCampaignLeadsResponse {
  leads: CampaignLeadItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CampaignsService {
  public async getCampaigns(params: ListCampaignsParams = {}): Promise<GetCampaignsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.type) searchParams.append('type', params.type);
    if (params.createdById) searchParams.append('createdById', params.createdById);
    if (params.startDateFrom) searchParams.append('startDateFrom', params.startDateFrom);
    if (params.startDateTo) searchParams.append('startDateTo', params.startDateTo);
    if (params.endDateFrom) searchParams.append('endDateFrom', params.endDateFrom);
    if (params.endDateTo) searchParams.append('endDateTo', params.endDateTo);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/campaigns${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch campaigns');
    }

    return {
      campaigns: json.data || [],
      pagination: json.meta || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getCampaignById(id: string): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${id}`);
  }

  public async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    return request<Campaign>('/campaigns', {
      method: 'POST',
      data: input
    });
  }

  public async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${id}`, {
      method: 'PUT',
      data: input
    });
  }

  public async deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/campaigns/${id}`, {
      method: 'DELETE'
    });
  }

  public async changeStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${id}/status`, {
      method: 'PATCH',
      data: { status }
    });
  }

  public async getCampaignLeads(
    id: string,
    params: { page?: number; limit?: number; search?: string; status?: string } = {}
  ): Promise<GetCampaignLeadsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}/leads${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch campaign leads');
    }

    return {
      leads: json.data || [],
      pagination: json.meta || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async addLead(campaignId: string, leadId: string): Promise<CampaignLeadItem> {
    return request<CampaignLeadItem>(`/campaigns/${campaignId}/leads`, {
      method: 'POST',
      data: { leadId }
    });
  }

  public async bulkAddLeads(
    campaignId: string,
    leadIds: string[]
  ): Promise<{ addedCount: number; message: string }> {
    return request<{ addedCount: number; message: string }>(`/campaigns/${campaignId}/leads/bulk`, {
      method: 'POST',
      data: { leadIds }
    });
  }

  public async removeLead(
    campaignId: string,
    leadId: string
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/campaigns/${campaignId}/leads/${leadId}`, {
      method: 'DELETE'
    });
  }
}

export const campaignsService = new CampaignsService();
