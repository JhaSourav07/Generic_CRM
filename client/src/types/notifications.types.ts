export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean | 'all';
}
