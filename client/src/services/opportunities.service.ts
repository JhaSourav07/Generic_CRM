import { request } from './api';
import {
  Opportunity,
  Pipeline,
  PipelineBoardData,
  PipelineStage,
  GetOpportunitiesQuery,
  GetOpportunitiesResponse,
  CreateOpportunityInput,
  UpdateOpportunityInput
} from '../types/opportunities.types';

export class OpportunitiesService {
  /**
   * Fetch opportunities list with server-side pagination, search, and filtering
   */
  public async getOpportunities(query: GetOpportunitiesQuery = {}): Promise<GetOpportunitiesResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.pipelineId) params.append('pipelineId', query.pipelineId);
    if (query.stageId) params.append('stageId', query.stageId);
    if (query.status) params.append('status', query.status);
    if (query.ownerId) params.append('ownerId', query.ownerId);
    if (query.accountId) params.append('accountId', query.accountId);
    if (query.contactId) params.append('contactId', query.contactId);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`http://localhost:5000/api/opportunities${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch opportunities');
    }

    return {
      opportunities: json.data,
      meta: json.meta
    };
  }

  /**
   * Get single opportunity with relational context
   */
  public async getOpportunityById(id: string): Promise<Opportunity> {
    return request<Opportunity>(`/opportunities/${id}`);
  }

  /**
   * Create new opportunity
   */
  public async createOpportunity(input: CreateOpportunityInput): Promise<Opportunity> {
    return request<Opportunity>('/opportunities', {
      method: 'POST',
      data: input
    });
  }

  /**
   * Update opportunity details
   */
  public async updateOpportunity(id: string, input: UpdateOpportunityInput): Promise<Opportunity> {
    return request<Opportunity>(`/opportunities/${id}`, {
      method: 'PATCH',
      data: input
    });
  }

  /**
   * Move opportunity to another stage in same pipeline
   */
  public async changeStage(id: string, stageId: string): Promise<Opportunity> {
    return request<Opportunity>(`/opportunities/${id}/stage`, {
      method: 'PATCH',
      data: { stageId }
    });
  }

  /**
   * Assign opportunity to a user
   */
  public async assignOpportunity(id: string, ownerId: string): Promise<Opportunity> {
    return request<Opportunity>(`/opportunities/${id}/assign`, {
      method: 'PATCH',
      data: { ownerId }
    });
  }

  /**
   * Mark opportunity as Won
   */
  public async winOpportunity(id: string): Promise<Opportunity> {
    return request<Opportunity>(`/opportunities/${id}/win`, {
      method: 'POST'
    });
  }

  /**
   * Mark opportunity as Lost with optional reason
   */
  public async loseOpportunity(id: string, reason?: string): Promise<Opportunity> {
    return request<Opportunity>(`/opportunities/${id}/lose`, {
      method: 'POST',
      data: { reason }
    });
  }

  /**
   * Soft-delete opportunity
   */
  public async deleteOpportunity(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/opportunities/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Fetch all pipelines
   */
  public async getPipelines(): Promise<Pipeline[]> {
    return request<Pipeline[]>('/pipelines');
  }

  /**
   * Fetch single pipeline by ID
   */
  public async getPipelineById(id: string): Promise<Pipeline> {
    return request<Pipeline>(`/pipelines/${id}`);
  }

  /**
   * High-Performance Single-Query Pipeline Kanban Board Aggregate Endpoint
   */
  public async getPipelineBoard(pipelineId?: string): Promise<PipelineBoardData> {
    const endpoint = pipelineId ? `/pipelines/${pipelineId}/board` : '/pipelines/default/board';
    return request<PipelineBoardData>(endpoint);
  }

  /**
   * Fetch stages for a pipeline
   */
  public async getStages(pipelineId: string): Promise<PipelineStage[]> {
    return request<PipelineStage[]>(`/pipelines/${pipelineId}/stages`);
  }
}

export const opportunitiesService = new OpportunitiesService();
