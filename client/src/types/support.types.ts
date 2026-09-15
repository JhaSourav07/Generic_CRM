import { Document } from './documents.types';

export type SupportCaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportCasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportCase {
  id: string;
  organizationId: string;
  caseNumber: string;
  subject: string;
  description?: string | null;
  priority: SupportCasePriority;
  status: SupportCaseStatus;
  accountId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
  createdById: string;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  account?: {
    id: string;
    name: string;
    industry?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  documents?: Document[];
  timeline?: {
    activities: any[];
    auditLogs: any[];
  };
  _count?: {
    documents: number;
  };
}

export interface ListSupportCasesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupportCaseStatus;
  priority?: SupportCasePriority;
  accountId?: string;
  contactId?: string;
  assignedToId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'subject';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSupportCaseInput {
  subject: string;
  description?: string | null;
  priority?: SupportCasePriority;
  accountId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
}

export interface UpdateSupportCaseInput {
  subject?: string;
  description?: string | null;
  priority?: SupportCasePriority;
  accountId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
}
