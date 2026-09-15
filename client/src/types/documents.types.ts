export interface Document {
  id: string;
  organizationId: string;
  uploadedById: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url?: string | null;
  leadId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  quoteId?: string | null;
  orderId?: string | null;
  supportCaseId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
  account?: {
    id: string;
    name: string;
  } | null;
  opportunity?: {
    id: string;
    name: string;
  } | null;
  quote?: {
    id: string;
    quoteNumber: string;
  } | null;
  order?: {
    id: string;
    orderNumber: string;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  supportCase?: {
    id: string;
    subject: string;
  } | null;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  mimeType?: string;
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  quoteId?: string;
  orderId?: string;
  supportCaseId?: string;
  sortBy?: 'createdAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}
