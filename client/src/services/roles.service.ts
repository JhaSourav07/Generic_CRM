import { request } from './api.js';
import { RoleItem, PermissionItem, CreateRolePayload, UpdateRolePayload } from '../types/roles.types.js';

export const rolesService = {
  async getRoles(): Promise<RoleItem[]> {
    return request<RoleItem[]>('/roles');
  },

  async getRoleById(id: string): Promise<RoleItem> {
    return request<RoleItem>(`/roles/${id}`);
  },

  async getPermissions(): Promise<PermissionItem[]> {
    return request<PermissionItem[]>('/permissions');
  },

  async createRole(payload: CreateRolePayload): Promise<RoleItem> {
    return request<RoleItem>('/roles', {
      method: 'POST',
      data: payload
    });
  },

  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
    return request<RoleItem>(`/roles/${id}`, {
      method: 'PUT',
      data: payload
    });
  },

  async deleteRole(id: string): Promise<{ id: string }> {
    return request<{ id: string }>(`/roles/${id}`, {
      method: 'DELETE'
    });
  }
};
