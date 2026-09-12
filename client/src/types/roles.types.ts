export interface PermissionItem {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface RoleItem {
  id: string;
  organizationId?: string | null;
  name: string;
  description?: string | null;
  isSystemRole?: boolean;
  userCount?: number;
  permissionCount?: number;
  createdAt?: string;
  updatedAt?: string;
  permissions?: PermissionItem[];
  _count?: {
    users: number;
  };
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
}
