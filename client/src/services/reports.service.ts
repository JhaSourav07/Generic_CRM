import {
  ReportType,
  ReportFilterParams,
  OverviewReportData,
  LeadReportData,
  SalesReportData,
  PipelineReportData,
  ActivityReportData,
  TaskReportData,
  SupportReportData,
  CampaignReportData
} from '../types/reports.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

function buildQueryString(params: ReportFilterParams = {}): string {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.ownerId) searchParams.append('ownerId', params.ownerId);
  if (params.assignedToId) searchParams.append('assignedToId', params.assignedToId);
  if (params.createdById) searchParams.append('createdById', params.createdById);
  if (params.status) searchParams.append('status', params.status);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.source) searchParams.append('source', params.source);
  if (params.type) searchParams.append('type', params.type);
  if (params.pipelineId) searchParams.append('pipelineId', params.pipelineId);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function fetchReportData<T>(endpoint: string, filters: ReportFilterParams = {}): Promise<T> {
  const qs = buildQueryString(filters);
  const response = await fetch(`${API_BASE_URL}/reports/${endpoint}${qs}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to fetch ${endpoint} report`);
  }

  return json.data as T;
}

export class ReportsService {
  public async getOverviewReport(filters?: ReportFilterParams): Promise<OverviewReportData> {
    return fetchReportData<OverviewReportData>('overview', filters);
  }

  public async getLeadReport(filters?: ReportFilterParams): Promise<LeadReportData> {
    return fetchReportData<LeadReportData>('leads', filters);
  }

  public async getSalesReport(filters?: ReportFilterParams): Promise<SalesReportData> {
    return fetchReportData<SalesReportData>('sales', filters);
  }

  public async getPipelineReport(filters?: ReportFilterParams): Promise<PipelineReportData> {
    return fetchReportData<PipelineReportData>('pipeline', filters);
  }

  public async getActivityReport(filters?: ReportFilterParams): Promise<ActivityReportData> {
    return fetchReportData<ActivityReportData>('activities', filters);
  }

  public async getTaskReport(filters?: ReportFilterParams): Promise<TaskReportData> {
    return fetchReportData<TaskReportData>('tasks', filters);
  }

  public async getSupportReport(filters?: ReportFilterParams): Promise<SupportReportData> {
    return fetchReportData<SupportReportData>('support', filters);
  }

  public async getCampaignReport(filters?: ReportFilterParams): Promise<CampaignReportData> {
    return fetchReportData<CampaignReportData>('campaigns', filters);
  }

  public async exportReport(reportType: ReportType, filters: ReportFilterParams = {}): Promise<void> {
    const qs = buildQueryString(filters);
    const response = await fetch(`${API_BASE_URL}/reports/${reportType}/export${qs}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Failed to export report CSV';
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) errorMessage = errorJson.error.message;
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename = `vynexa-${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const reportsService = new ReportsService();
