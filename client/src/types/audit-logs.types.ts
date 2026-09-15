export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'action' | 'entity';
  sortOrder?: 'asc' | 'desc';
}

export interface GetAuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
