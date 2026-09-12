import { request } from './api.js';
import {
  UserItem,
  UserListParams,
  CreateUserPayload,
  UpdateUserPayload
} from '../types/users.types.js';
import { ApiResponse } from '../types/index.js';

export const usersService = {
  async getUsers(params: UserListParams = {}): Promise<{ users: UserItem[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.roleId) queryParams.set('roleId', params.roleId);
    if (params.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    const rawResponse = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const resData: ApiResponse<UserItem[]> = await rawResponse.json();
    if (!rawResponse.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to fetch users');
    }

    return {
      users: resData.data || [],
      meta: resData.meta || { page: 1, limit: 10, total: 0 }
    };
  },

  async getUserById(id: string): Promise<UserItem> {
    return request<UserItem>(`/users/${id}`);
  },

  async createUser(payload: CreateUserPayload): Promise<UserItem> {
    return request<UserItem>('/users', {
      method: 'POST',
      data: payload
    });
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserItem> {
    return request<UserItem>(`/users/${id}`, {
      method: 'PUT',
      data: payload
    });
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<UserItem> {
    return request<UserItem>(`/users/${id}/status`, {
      method: 'PATCH',
      data: { isActive }
    });
  }
};
