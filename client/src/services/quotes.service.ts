import { request } from './api';
import {
  Quote,
  GetQuotesParams,
  GetQuotesResponse,
  CreateQuotePayload,
  UpdateQuotePayload
} from '../types/quotes.types';
import { Order } from '../types/orders.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export class QuotesService {
  public async getQuotes(params: GetQuotesParams = {}): Promise<GetQuotesResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId);
    if (params.ownerId) searchParams.append('ownerId', params.ownerId);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/quotes${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch quotes');
    }

    return {
      quotes: json.data,
      pagination: json.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getQuoteById(id: string): Promise<Quote> {
    return request<Quote>(`/quotes/${id}`);
  }

  public async createQuote(payload: CreateQuotePayload): Promise<Quote> {
    return request<Quote>('/quotes', {
      method: 'POST',
      data: payload
    });
  }

  public async updateQuote(id: string, payload: UpdateQuotePayload): Promise<Quote> {
    return request<Quote>(`/quotes/${id}`, {
      method: 'PATCH',
      data: payload
    });
  }

  public async deleteQuote(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/quotes/${id}`, {
      method: 'DELETE'
    });
  }

  public async sendQuote(id: string): Promise<Quote> {
    return request<Quote>(`/quotes/${id}/send`, {
      method: 'POST'
    });
  }

  public async approveQuote(id: string): Promise<Quote> {
    return request<Quote>(`/quotes/${id}/approve`, {
      method: 'POST'
    });
  }

  public async rejectQuote(id: string, reason?: string): Promise<Quote> {
    return request<Quote>(`/quotes/${id}/reject`, {
      method: 'POST',
      data: { reason }
    });
  }

  public async expireQuote(id: string): Promise<Quote> {
    return request<Quote>(`/quotes/${id}/expire`, {
      method: 'POST'
    });
  }

  public async convertToOrder(id: string): Promise<Order> {
    return request<Order>(`/quotes/${id}/convert-to-order`, {
      method: 'POST'
    });
  }
}

export const quotesService = new QuotesService();
