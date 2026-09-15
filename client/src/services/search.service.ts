import { request } from './api.js';
import { SearchResponseData } from '../types/search.types.js';

export const searchService = {
  /**
   * Execute global CRM search across authorized entities.
   */
  search: async (query: string, limit = 5): Promise<SearchResponseData> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        query: '',
        totalMatches: 0,
        results: [],
        grouped: {
          leads: [],
          customers: [],
          contacts: [],
          opportunities: [],
          tasks: [],
          activities: [],
          quotes: [],
          orders: [],
          support_cases: [],
          campaigns: [],
          products: []
        }
      };
    }

    return request<SearchResponseData>(
      `/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    );
  }
};
