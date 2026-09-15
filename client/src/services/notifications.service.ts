import { request } from './api';
import { Notification, ListNotificationsParams } from '../types/notifications.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class NotificationsService {
  public async getNotifications(params: ListNotificationsParams = {}): Promise<GetNotificationsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.isRead !== undefined) searchParams.append('isRead', params.isRead.toString());

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/notifications${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch notifications');
    }

    return {
      notifications: json.data || [],
      unreadCount: json.meta?.unreadCount || 0,
      pagination: json.meta || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getUnreadCount(): Promise<number> {
    const res = await request<{ unreadCount: number }>('/notifications/unread-count');
    return res.unreadCount;
  }

  public async markAsRead(id: string): Promise<Notification> {
    return request<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }

  public async markAllAsRead(): Promise<{ success: boolean; updatedCount: number }> {
    return request<{ success: boolean; updatedCount: number }>('/notifications/read-all', {
      method: 'PATCH'
    });
  }

  public async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }
}

export const notificationsService = new NotificationsService();
