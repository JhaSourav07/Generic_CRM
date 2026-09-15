export type ProductType = 'PRODUCT' | 'SERVICE';

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string | null;
  description: string | null;
  type: ProductType;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    quoteItems: number;
    orderItems: number;
  };
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProductType;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'sku';
  sortOrder?: 'asc' | 'desc';
}

export interface GetProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductPayload {
  name: string;
  sku?: string | null;
  description?: string | null;
  type?: ProductType;
  price: number;
  currency?: string;
  isActive?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string | null;
  description?: string | null;
  type?: ProductType;
  price?: number;
  currency?: string;
  isActive?: boolean;
}
