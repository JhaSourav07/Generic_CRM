export interface UserItem {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  isActive: boolean;
  organizationId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserListResult {
  users: UserItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  roleId: string;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  roleId?: string;
  password?: string;
  isActive?: boolean;
}
