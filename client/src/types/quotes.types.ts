import { Product } from './products.types';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  product?: Product | null;
}

export interface Quote {
  id: string;
  organizationId: string;
  accountId: string | null;
  opportunityId: string | null;
  createdById: string;
  quoteNumber: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
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
    status?: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  orders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total?: number;
    createdAt?: string;
  }>;
  _count?: {
    items: number;
  };
}

export interface QuoteLineItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
}

export interface CreateQuotePayload {
  accountId?: string | null;
  opportunityId?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  items: QuoteLineItemInput[];
}

export interface UpdateQuotePayload {
  accountId?: string | null;
  opportunityId?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  items?: QuoteLineItemInput[];
}

export interface GetQuotesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuoteStatus;
  accountId?: string;
  opportunityId?: string;
  ownerId?: string;
  sortBy?: 'quoteNumber' | 'total' | 'validUntil' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetQuotesResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
