import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  LayoutDashboard,
  UserCheck,
  Building2,
  Contact,
  Kanban,
  TrendingUp,
  FileText,
  ShoppingBag,
  Package,
  CheckSquare,
  Calendar,
  LifeBuoy,
  Megaphone,
  BarChart3,
  Settings,
  History,
  Clock,
  Plus,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';
import { searchService } from '@/services/search.service';
import { SearchResultItem, SearchEntityType, RecentSearchItem } from '@/types/search.types';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  category: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-lead', label: 'Add lead', category: 'CRM', path: '/app/leads?action=create', icon: Plus },
  { id: 'new-customer', label: 'Add customer', category: 'CRM', path: '/app/customers?action=create', icon: Plus },
  { id: 'new-contact', label: 'Add contact', category: 'CRM', path: '/app/contacts?action=create', icon: Plus },
  { id: 'new-opp', label: 'Add opportunity', category: 'Sales', path: '/app/opportunities?action=create', icon: Plus },
  { id: 'new-task', label: 'Add task', category: 'Workspace', path: '/app/tasks?action=create', icon: Plus },
  { id: 'new-quote', label: 'Create quote', category: 'Sales', path: '/app/quotes?action=create', icon: Plus }
];

const NAVIGATION_SHORTCUTS: QuickAction[] = [
  { id: 'nav-dash', label: 'Dashboard', category: 'Overview', path: '/app/dashboard', icon: LayoutDashboard },
  { id: 'nav-leads', label: 'Leads', category: 'CRM', path: '/app/leads', icon: UserCheck },
  { id: 'nav-cust', label: 'Customers', category: 'CRM', path: '/app/customers', icon: Building2 },
  { id: 'nav-pipe', label: 'Sales Pipeline', category: 'Sales', path: '/app/pipeline', icon: Kanban },
  { id: 'nav-opps', label: 'Opportunities', category: 'Sales', path: '/app/opportunities', icon: TrendingUp },
  { id: 'nav-quotes', label: 'Quotes', category: 'Sales', path: '/app/quotes', icon: FileText },
  { id: 'nav-orders', label: 'Orders', category: 'Sales', path: '/app/orders', icon: ShoppingBag },
  { id: 'nav-prods', label: 'Products', category: 'Sales', path: '/app/products', icon: Package },
  { id: 'nav-tasks', label: 'Tasks', category: 'Workspace', path: '/app/tasks', icon: CheckSquare },
  { id: 'nav-support', label: 'Support', category: 'Support', path: '/app/support', icon: LifeBuoy },
  { id: 'nav-camps', label: 'Campaigns', category: 'Marketing', path: '/app/campaigns', icon: Megaphone },
  { id: 'nav-reports', label: 'Reports', category: 'Insights', path: '/app/reports', icon: BarChart3 },
  { id: 'nav-audits', label: 'Audit Log', category: 'Admin', path: '/app/audit-logs', icon: History },
  { id: 'nav-settings', label: 'Settings', category: 'Admin', path: '/app/settings', icon: Settings }
];

const ENTITY_ICONS: Record<SearchEntityType, React.ComponentType<{ className?: string }>> = {
  lead: UserCheck,
  customer: Building2,
  contact: Contact,
  opportunity: TrendingUp,
  task: CheckSquare,
  activity: Calendar,
  quote: FileText,
  order: ShoppingBag,
  support_case: LifeBuoy,
  campaign: Megaphone,
  product: Package
};

const ENTITY_LABELS: Record<SearchEntityType, string> = {
  lead: 'Lead',
  customer: 'Customer',
  contact: 'Contact',
  opportunity: 'Opportunity',
  task: 'Task',
  activity: 'Activity',
  quote: 'Quote',
  order: 'Order',
  support_case: 'Support Request',
  campaign: 'Campaign',
  product: 'Product'
};

const RECENT_SEARCHES_KEY = 'vynexa_recent_searches';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentSearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load recent searches on mount / open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentItems(JSON.parse(stored));
        }
      } catch (_err) {
        setRecentItems([]);
      }
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Save selected item to recent searches
  const saveToRecent = (item: { id: string; title: string; entityType: any; url: string }) => {
    try {
      const existing: RecentSearchItem[] = JSON.parse(
        localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'
      );
      const filtered = existing.filter((r) => r.url !== item.url);
      const updated: RecentSearchItem[] = [
        {
          id: item.id,
          title: item.title,
          entityType: item.entityType,
          url: item.url,
          timestamp: Date.now()
        },
        ...filtered
      ].slice(0, 5);

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentItems(updated);
    } catch (_err) {}
  };

  const clearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentItems([]);
  };

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchService.search(trimmed, 5);
        setResults(data.results);
        setSelectedIndex(0);
      } catch (_err) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Calculate active navigation list for keyboard controls
  const activeItems: { title: string; url: string; itemRef: any }[] = React.useMemo(() => {
    if (query.trim()) {
      return results.map((r) => ({ title: r.title, url: r.url, itemRef: r }));
    }

    const items: { title: string; url: string; itemRef: any }[] = [];
    recentItems.forEach((r) => items.push({ title: r.title, url: r.url, itemRef: r }));
    QUICK_ACTIONS.forEach((a) => items.push({ title: a.label, url: a.path, itemRef: a }));
    NAVIGATION_SHORTCUTS.forEach((n) => items.push({ title: n.label, url: n.path, itemRef: n }));
    return items;
  }, [query, results, recentItems]);

  const handleSelect = useCallback(
    (url: string, itemData?: any) => {
      if (itemData) {
        saveToRecent({
          id: itemData.id || url,
          title: itemData.title || itemData.label || 'Item',
          entityType: itemData.entityType || 'navigation',
          url
        });
      }
      onClose();
      navigate(url);
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (activeItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (activeItems.length || 1)) % (activeItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeItems[selectedIndex];
      if (target) {
        handleSelect(target.url, target.itemRef);
      }
    }
  };

  // Ensure selected item stays in view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/75 backdrop-blur-[2px] p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-vynexa-surface-elevated border border-vynexa-border rounded-lg shadow-2xl overflow-hidden text-vynexa-text-primary flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-vynexa-border px-4 py-3 bg-vynexa-surface">
          <Search className="h-4 w-4 text-vynexa-text-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, leads, contacts, and more..."
            className="w-full bg-transparent text-sm text-vynexa-text-primary placeholder:text-vynexa-text-muted focus:outline-none"
            aria-label="Search"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 text-vynexa-text-muted animate-spin mr-2 shrink-0" />
          )}
          {query && !isLoading && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-vynexa-text-muted hover:text-vynexa-text-primary mr-2"
              title="Clear input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-vynexa-border bg-vynexa-surface-secondary px-1.5 font-mono text-[10px] font-medium text-vynexa-text-muted select-none">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* 1. If Query is Active */}
          {query.trim() ? (
            results.length === 0 && !isLoading ? (
              <div className="py-12 text-center text-xs text-vynexa-text-muted select-none">
                <Search className="h-6 w-6 text-vynexa-text-muted/40 mx-auto mb-2" />
                <p>No results found for "{query}".</p>
                <p className="mt-1 text-[11px] text-vynexa-text-muted/70">
                  Try searching with different keywords or check your spelling.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">
                  Results ({results.length})
                </div>
                {results.map((item, index) => {
                  const Icon = ENTITY_ICONS[item.entityType] || Building2;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={`${item.entityType}-${item.id}`}
                      data-index={index}
                      onClick={() => handleSelect(item.url, item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors text-xs select-none ${
                        isSelected
                          ? 'bg-vynexa-surface-secondary border border-vynexa-border text-vynexa-text-primary'
                          : 'text-vynexa-text-secondary hover:bg-vynexa-surface/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-7 w-7 rounded border border-vynexa-border bg-vynexa-surface flex items-center justify-center text-vynexa-text-muted shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-vynexa-text-primary flex items-center gap-2 truncate">
                            <span className="truncate">{item.title}</span>
                            <span className="text-[9px] font-mono text-vynexa-text-muted px-1.5 py-0.2 rounded border border-vynexa-border/50 bg-vynexa-surface shrink-0">
                              {ENTITY_LABELS[item.entityType] || item.entityType}
                            </span>
                            {item.status && (
                              <span className="text-[9px] font-mono text-vynexa-text-secondary px-1.5 py-0.2 rounded bg-vynexa-surface shrink-0">
                                {item.status}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-vynexa-text-muted truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <ArrowRight className={`h-3.5 w-3.5 ${isSelected ? 'text-vynexa-text-primary' : 'text-transparent'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* 2. Empty Query State: Recents, Actions & Navigation */
            <div className="space-y-4">
              {/* Recent Searches */}
              {recentItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Recent searches
                    </span>
                    <button
                      onClick={clearRecent}
                      className="text-[10px] font-mono text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {recentItems.map((recent, rIdx) => {
                    const isSelected = rIdx === selectedIndex;
                    return (
                      <div
                        key={recent.id || recent.url}
                        data-index={rIdx}
                        onClick={() => handleSelect(recent.url, recent)}
                        onMouseEnter={() => setSelectedIndex(rIdx)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs select-none ${
                          isSelected
                            ? 'bg-vynexa-surface-secondary border border-vynexa-border text-vynexa-text-primary'
                            : 'text-vynexa-text-secondary hover:bg-vynexa-surface/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <History className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
                          <span className="truncate">{recent.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-vynexa-text-muted capitalize shrink-0 ml-2">
                          {recent.entityType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">
                  Quick actions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {QUICK_ACTIONS.map((action, aIdx) => {
                    const globalIdx = recentItems.length + aIdx;
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.id}
                        data-index={globalIdx}
                        onClick={() => handleSelect(action.path, action)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors text-xs select-none ${
                          isSelected
                            ? 'bg-vynexa-surface-secondary border border-vynexa-border text-vynexa-text-primary'
                            : 'text-vynexa-text-secondary hover:bg-vynexa-surface/60 border border-transparent'
                        }`}
                      >
                        <div className="h-5 w-5 rounded border border-vynexa-border bg-vynexa-surface flex items-center justify-center text-vynexa-text-muted shrink-0">
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="truncate font-medium">{action.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">
                  Navigation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {NAVIGATION_SHORTCUTS.map((nav, nIdx) => {
                    const globalIdx = recentItems.length + QUICK_ACTIONS.length + nIdx;
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = nav.icon;
                    return (
                      <div
                        key={nav.id}
                        data-index={globalIdx}
                        onClick={() => handleSelect(nav.path, nav)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs select-none ${
                          isSelected
                            ? 'bg-vynexa-surface-secondary border border-vynexa-border text-vynexa-text-primary'
                            : 'text-vynexa-text-secondary hover:bg-vynexa-surface/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
                          <span className="truncate">{nav.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-vynexa-text-muted px-1.5 py-0.2 rounded border border-vynexa-border/40 bg-vynexa-surface shrink-0 ml-2">
                          {nav.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-vynexa-surface border-t border-vynexa-border flex items-center justify-between text-[11px] text-vynexa-text-muted font-mono select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" /> Quick search
          </div>
        </div>
      </div>
    </div>
  );
};
