export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  probability: number;
  opportunityCount?: number;
  totalValue?: number;
  opportunities?: Opportunity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    opportunities: number;
  };
}

export interface Opportunity {
  id: string;
  organizationId: string;
  accountId?: string | null;
  contactId?: string | null;
  ownerId?: string | null;
  pipelineId: string;
  stageId: string;
  name: string;
  description?: string | null;
  value: number;
  probability: number;
  expectedCloseDate?: string | null;
  status: OpportunityStatus;
  lostReason?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    industry?: string | null;
    website?: string | null;
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
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  pipeline?: {
    id: string;
    name: string;
    stages?: PipelineStage[];
  } | null;
  stage?: PipelineStage | null;
  activities?: any[];
  tasks?: any[];
}

export interface PipelineBoardData {
  pipeline: {
    id: string;
    name: string;
    description?: string | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  stages: PipelineStage[];
  totals: {
    openCount: number;
    openValue: number;
    weightedValue: number;
    wonValue: number;
    lostValue: number;
  };
}

export interface GetOpportunitiesQuery {
  page?: number;
  limit?: number;
  search?: string;
  pipelineId?: string;
  stageId?: string;
  status?: OpportunityStatus;
  ownerId?: string;
  accountId?: string;
  contactId?: string;
  sortBy?: 'createdAt' | 'name' | 'value' | 'expectedCloseDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface GetOpportunitiesResponse {
  opportunities: Opportunity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    totalCount: number;
    openCount: number;
    openValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    lostValue: number;
  };
}

export interface CreateOpportunityInput {
  name: string;
  description?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  pipelineId: string;
  stageId: string;
  ownerId?: string | null;
  value?: number;
  probability?: number;
  expectedCloseDate?: string | null;
}

export interface UpdateOpportunityInput {
  name?: string;
  description?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  pipelineId?: string;
  stageId?: string;
  ownerId?: string | null;
  value?: number;
  probability?: number;
  expectedCloseDate?: string | null;
}
