export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE' | 'OTHER';

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
}

export interface ActivityEntityRef {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  createdById: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  activityDate: string;
  duration: number | null;
  leadId: string | null;
  accountId: string | null;
  contactId: string | null;
  opportunityId: string | null;
  createdAt: string;
  updatedAt: string;

  createdBy?: ActivityUser;
  lead?: ActivityEntityRef | null;
  account?: ActivityEntityRef | null;
  contact?: ActivityEntityRef | null;
  opportunity?: ActivityEntityRef | null;
}

export interface CreateActivityPayload {
  type: ActivityType;
  subject: string;
  description?: string | null;
  activityDate?: string;
  duration?: number | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
}

export interface UpdateActivityPayload {
  type?: ActivityType;
  subject?: string;
  description?: string | null;
  activityDate?: string;
  duration?: number | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
}

export interface GetActivitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ActivityType;
  createdById?: string;
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'activityDate' | 'createdAt' | 'subject' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface GetActivitiesResponse {
  activities: Activity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
