export type CustomerStatus = 'active' | 'onboarding' | 'inactive' | 'churned';
export type CustomerTier = 'standard' | 'premium' | 'enterprise' | 'vip';

export interface CustomerOwner {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface CustomerCount {
  contacts: number;
  opportunities: number;
}

export interface Customer {
  id: string;
  organizationId: string;
  ownerId?: string | null;
  name: string;
  industry?: string | null;
  domain?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  tier?: CustomerTier | null;
  annualRevenue?: number | null;
  status: CustomerStatus | string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: CustomerOwner | null;
  _count?: CustomerCount;
  contacts?: any[];
  opportunities?: any[];
  convertedFromLeads?: any[];
}

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  status?: CustomerStatus | string;
  tier?: CustomerTier | string;
  ownerId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'industry' | 'status' | 'annualRevenue';
  sortOrder?: 'asc' | 'desc';
}

export interface GetCustomersResponse {
  customers: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCustomerInput {
  name: string;
  industry?: string;
  domain?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  tier?: CustomerTier;
  annualRevenue?: number;
  status?: CustomerStatus;
  notes?: string;
  ownerId?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  industry?: string;
  domain?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  tier?: CustomerTier;
  annualRevenue?: number;
  status?: CustomerStatus;
  notes?: string;
  ownerId?: string;
}
