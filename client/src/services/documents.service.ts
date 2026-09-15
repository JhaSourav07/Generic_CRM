import { request } from './api';
import { Document, ListDocumentsParams } from '../types/documents.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface GetDocumentsResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class DocumentsService {
  public async getDocuments(params: ListDocumentsParams = {}): Promise<GetDocumentsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.mimeType) searchParams.append('mimeType', params.mimeType);
    if (params.leadId) searchParams.append('leadId', params.leadId);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId);
    if (params.quoteId) searchParams.append('quoteId', params.quoteId);
    if (params.orderId) searchParams.append('orderId', params.orderId);
    if (params.supportCaseId) searchParams.append('supportCaseId', params.supportCaseId);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/documents${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch documents');
    }

    return {
      documents: json.data || [],
      pagination: json.meta || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  public async getDocumentById(id: string): Promise<Document> {
    return request<Document>(`/documents/${id}`);
  }

  public async uploadDocument(formData: FormData): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to upload document');
    }

    return json.data;
  }

  public getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/documents/${id}/download`;
  }

  public async updateDocument(id: string, name: string): Promise<Document> {
    return request<Document>(`/documents/${id}`, {
      method: 'PATCH',
      data: { name }
    });
  }

  public async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/documents/${id}`, {
      method: 'DELETE'
    });
  }
}

export const documentsService = new DocumentsService();
