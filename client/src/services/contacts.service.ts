import { request } from './api';
import {
  Contact,
  GetContactsQuery,
  GetContactsResponse,
  CreateContactInput,
  UpdateContactInput
} from '../types/contacts.types';

export class ContactsService {
  public async getContacts(query: GetContactsQuery = {}): Promise<GetContactsResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.accountId) params.append('accountId', query.accountId);
    if (query.jobTitle) params.append('jobTitle', query.jobTitle);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`http://localhost:5000/api/contacts${queryString}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch contact directory');
    }

    return {
      contacts: json.data,
      meta: json.meta
    };
  }

  public async getContactById(id: string): Promise<Contact> {
    return request<Contact>(`/contacts/${id}`);
  }

  public async getContact(id: string): Promise<Contact> {
    return this.getContactById(id);
  }

  public async createContact(input: CreateContactInput): Promise<Contact> {
    return request<Contact>('/contacts', {
      method: 'POST',
      data: input
    });
  }

  public async updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
    return request<Contact>(`/contacts/${id}`, {
      method: 'PATCH',
      data: input
    });
  }

  public async deleteContact(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/contacts/${id}`, {
      method: 'DELETE'
    });
  }
}

export const contactsService = new ContactsService();
