import { request } from './api';
import {
  AuditLog,
  ListAuditLogsParams,
  GetAuditLogsResponse
} from '../types/audit-logs.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export class AuditLogsService {
  public async getAuditLogs(params: ListAuditLogsParams = {}): Promise<GetAuditLogsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.action) searchParams.append('action', params.action);
    if (params.entity) searchParams.append('entity', params.entity);
    if (params.entityId) searchParams.append('entityId', params.entityId);
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/audit-logs${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch audit logs');
    }

    return {
      logs: json.data || [],
      pagination: json.meta || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getAuditLogById(id: string): Promise<AuditLog> {
    return request<AuditLog>(`/audit-logs/${id}`);
  }
}

export const auditLogsService = new AuditLogsService();
