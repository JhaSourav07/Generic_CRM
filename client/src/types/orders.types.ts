import { Product } from './products.types';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  product?: Product | null;
}

export interface Order {
  id: string;
  organizationId: string;
  accountId: string | null;
  opportunityId: string | null;
  quoteId: string | null;
  createdById: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  account?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  opportunity?: {
    id: string;
    name: string;
    value?: number;
  } | null;
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
    total: number;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    items: number;
  };
}

export interface OrderLineItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
}

export interface CreateOrderPayload {
  accountId?: string | null;
  opportunityId?: string | null;
  quoteId?: string | null;
  notes?: string | null;
  items: OrderLineItemInput[];
}

export interface UpdateOrderPayload {
  notes?: string | null;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  accountId?: string;
  opportunityId?: string;
  quoteId?: string;
  ownerId?: string;
  sortBy?: 'orderNumber' | 'total' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
