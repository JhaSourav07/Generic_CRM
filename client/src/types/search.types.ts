export type SearchEntityType =
  | 'lead'
  | 'customer'
  | 'contact'
  | 'opportunity'
  | 'task'
  | 'activity'
  | 'quote'
  | 'order'
  | 'support_case'
  | 'campaign'
  | 'product';

export interface SearchResultItem {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  status?: string;
  url: string;
  createdAt: string;
}

export interface GroupedSearchResults {
  leads: SearchResultItem[];
  customers: SearchResultItem[];
  contacts: SearchResultItem[];
  opportunities: SearchResultItem[];
  tasks: SearchResultItem[];
  activities: SearchResultItem[];
  quotes: SearchResultItem[];
  orders: SearchResultItem[];
  support_cases: SearchResultItem[];
  campaigns: SearchResultItem[];
  products: SearchResultItem[];
}

export interface SearchResponseData {
  query: string;
  totalMatches: number;
  results: SearchResultItem[];
  grouped: GroupedSearchResults;
}

export interface RecentSearchItem {
  id: string;
  title: string;
  entityType: SearchEntityType | 'navigation';
  url: string;
  timestamp: number;
}
