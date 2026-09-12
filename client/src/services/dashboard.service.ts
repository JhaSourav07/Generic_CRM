import { request } from './api.js';
import { DashboardOverviewData } from '../types/dashboard.types.js';

export const dashboardService = {
  async getOverview(): Promise<DashboardOverviewData> {
    return request<DashboardOverviewData>('/dashboard/overview', {
      method: 'GET'
    });
  }
};
