export type LeadStatus = 'NEW' | 'QUALIFIED' | 'ASSIGNED' | 'CONTACTED' | 'CONVERTED' | 'LOST';

export interface LeadOwner {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface ConvertedAccount {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
}

export interface ConvertedContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
}

export type LeadScoreCategory = 'COLD' | 'COOL' | 'WARM' | 'HOT';

export interface LeadScoreBreakdownDetails {
  fit: number;
  fitMax: number;
  contactQuality: number;
  contactQualityMax: number;
  engagement: number;
  engagementMax: number;
  opportunity: number;
  opportunityMax: number;
  recency: number;
  recencyMax: number;
  negativeSignals: number;
}

export interface LeadScoreBreakdown {
  score: number;
  category: LeadScoreCategory;
  breakdown: LeadScoreBreakdownDetails;
  reasons: string[];
}

export interface Lead {
  id: string;
  organizationId: string;
  ownerId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  source?: string | null;
  status: LeadStatus;
  score: number;
  scoreCategory?: LeadScoreCategory | null;
  scoreUpdatedAt?: string | null;
  scoreAlgorithmVersion?: string | null;
  notes?: string | null;
  convertedAccountId?: string | null;
  convertedContactId?: string | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: LeadOwner | null;
  convertedAccount?: ConvertedAccount | null;
  convertedContact?: ConvertedContact | null;
}

export interface GetLeadsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: string;
  ownerId?: string;
  scoreCategory?: LeadScoreCategory;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'company' | 'score' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface GetLeadsResponse {
  leads: Lead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: LeadStatus;
  score?: number;
  notes?: string;
  ownerId?: string;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: LeadStatus;
  score?: number;
  notes?: string;
  ownerId?: string;
}

export interface ConvertLeadInput {
  account?: {
    name?: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
  };
  createOpportunity?: boolean;
  opportunity?: {
    name?: string;
    value?: number;
    pipelineId?: string;
    stageId?: string;
    expectedCloseDate?: string;
  };
}

export interface ConvertLeadResult {
  lead: Lead;
  accountId: string;
  contactId: string;
  opportunityId?: string;
}
