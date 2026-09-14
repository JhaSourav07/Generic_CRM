export interface ContactAccount {
  id: string;
  name: string;
  industry?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Contact {
  id: string;
  organizationId: string;
  accountId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: ContactAccount | null;
  opportunities?: any[];
  convertedFromLeads?: any[];
}

export interface GetContactsQuery {
  page?: number;
  limit?: number;
  search?: string;
  accountId?: string;
  jobTitle?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' | 'jobTitle';
  sortOrder?: 'asc' | 'desc';
}

export interface GetContactsResponse {
  contacts: Contact[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  isPrimary?: boolean;
  accountId?: string;
  notes?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  isPrimary?: boolean;
  accountId?: string;
  notes?: string;
}
