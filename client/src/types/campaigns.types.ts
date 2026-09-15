export type CampaignStatus = 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  type?: string | null;
  status: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  metrics?: CampaignMetrics;
  _count?: {
    campaignLeads: number;
  };
}

export interface CampaignMetrics {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  linkedOpportunitiesCount: number;
  pipelineValue: number;
  wonValue: number;
  attributableOrdersCount: number;
  attributableRevenue: number;
  roi: number | null;
}

export interface CampaignLeadItem {
  id: string;
  campaignId: string;
  leadId: string;
  addedAt: string;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    status: string;
    score: number;
    owner?: {
      id: string;
      name: string;
      email: string;
    } | null;
    createdAt: string;
  };
}

export interface ListCampaignsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus;
  type?: string;
  createdById?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status' | 'type' | 'budget' | 'startDate' | 'endDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCampaignInput {
  name: string;
  description?: string | null;
  type?: string | null;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string | null;
  type?: string | null;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
}
