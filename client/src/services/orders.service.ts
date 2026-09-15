import { request } from './api';
import {
  Order,
  GetOrdersParams,
  GetOrdersResponse,
  CreateOrderPayload,
  UpdateOrderPayload
} from '../types/orders.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export class OrdersService {
  public async getOrders(params: GetOrdersParams = {}): Promise<GetOrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId);
    if (params.quoteId) searchParams.append('quoteId', params.quoteId);
    if (params.ownerId) searchParams.append('ownerId', params.ownerId);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/orders${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch orders');
    }

    return {
      orders: json.data,
      pagination: json.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getOrderById(id: string): Promise<Order> {
    return request<Order>(`/orders/${id}`);
  }

  public async createOrder(payload: CreateOrderPayload): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      data: payload
    });
  }

  public async updateOrder(id: string, payload: UpdateOrderPayload): Promise<Order> {
    return request<Order>(`/orders/${id}`, {
      method: 'PATCH',
      data: payload
    });
  }

  public async deleteOrder(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE'
    });
  }

  public async confirmOrder(id: string): Promise<Order> {
    return request<Order>(`/orders/${id}/confirm`, {
      method: 'POST'
    });
  }

  public async processOrder(id: string): Promise<Order> {
    return request<Order>(`/orders/${id}/process`, {
      method: 'POST'
    });
  }

  public async completeOrder(id: string): Promise<Order> {
    return request<Order>(`/orders/${id}/complete`, {
      method: 'POST'
    });
  }

  public async cancelOrder(id: string, reason?: string): Promise<Order> {
    return request<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
      data: { reason }
    });
  }
}

export const ordersService = new OrdersService();
