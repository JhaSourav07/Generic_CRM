export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
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
