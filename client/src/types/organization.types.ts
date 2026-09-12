export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  currency?: string;
  timezone?: string;
}
