export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
  error: {
    code: string;
    message: string;
  } | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  avatarUrl?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string | number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export * from './auth.types.ts';
export * from './dashboard.types.ts';
export * from './users.types.ts';
export * from './roles.types.ts';
export * from './organization.types.ts';
export * from './activities.types.ts';
export * from './tasks.types.ts';
export * from './products.types.ts';
export * from './quotes.types.ts';
export * from './orders.types.ts';
export * from './documents.types.ts';
export * from './notifications.types.ts';
export * from './support.types.ts';
export * from './campaigns.types.ts';
export * from './reports.types.ts';
export * from './audit-logs.types.ts';
