import { request } from './api.js';
import { OrganizationDetails, UpdateOrganizationPayload } from '../types/organization.types.js';

export const organizationService = {
  async getCurrentOrganization(): Promise<OrganizationDetails> {
    return request<OrganizationDetails>('/organization/current');
  },

  async updateOrganization(payload: UpdateOrganizationPayload): Promise<OrganizationDetails> {
    return request<OrganizationDetails>('/organization/current', {
      method: 'PATCH',
      data: payload
    });
  }
};
