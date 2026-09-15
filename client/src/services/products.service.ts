import { request } from './api';
import {
  Product,
  GetProductsParams,
  GetProductsResponse,
  CreateProductPayload,
  UpdateProductPayload
} from '../types/products.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export class ProductsService {
  public async getProducts(params: GetProductsParams = {}): Promise<GetProductsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.type) searchParams.append('type', params.type);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/products${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch products');
    }

    return {
      products: json.data,
      pagination: json.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getProductById(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`);
  }

  public async createProduct(payload: CreateProductPayload): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      data: payload
    });
  }

  public async updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'PATCH',
      data: payload
    });
  }

  public async deleteProduct(id: string): Promise<{ message: string; deactivated?: boolean; deleted?: boolean }> {
    return request<{ message: string; deactivated?: boolean; deleted?: boolean }>(`/products/${id}`, {
      method: 'DELETE'
    });
  }
}

export const productsService = new ProductsService();
