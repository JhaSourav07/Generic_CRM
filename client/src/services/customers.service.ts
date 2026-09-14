import { request } from './api';
import {
  Customer,
  GetCustomersQuery,
  GetCustomersResponse,
  CreateCustomerInput,
  UpdateCustomerInput
} from '../types/customers.types';

export class CustomersService {
  public async getCustomers(query: GetCustomersQuery = {}): Promise<GetCustomersResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.industry) params.append('industry', query.industry);
    if (query.status) params.append('status', query.status);
    if (query.ownerId) params.append('ownerId', query.ownerId);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`http://localhost:5000/api/customers${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch customer directory');
    }

    return {
      customers: json.data,
      meta: json.meta
    };
  }

  public async getCustomerById(id: string): Promise<Customer> {
    return request<Customer>(`/customers/${id}`);
  }

  public async getCustomer(id: string): Promise<Customer> {
    return this.getCustomerById(id);
  }

  public async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return request<Customer>('/customers', {
      method: 'POST',
      data: input
    });
  }

  public async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    return request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      data: input
    });
  }

  public async assignCustomer(id: string, ownerId: string): Promise<Customer> {
    return request<Customer>(`/customers/${id}/assign`, {
      method: 'PATCH',
      data: { ownerId }
    });
  }

  public async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/customers/${id}`, {
      method: 'DELETE'
    });
  }
}

export const customersService = new CustomersService();
