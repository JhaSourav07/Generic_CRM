import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, LayoutDashboard, UserCheck, Building2, Contact, Kanban, CheckSquare, Calendar, LifeBuoy, Megaphone, BarChart3, Settings, ShieldCheck, X } from 'lucide-react';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: string;
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: 'dash', category: 'Navigation', label: 'Executive Dashboard', description: 'Real-time pipeline & business metrics overview', path: '/app/dashboard', icon: LayoutDashboard },
  { id: 'leads', category: 'CRM', label: 'Leads Directory', description: 'Manage, triage, and score potential prospects', path: '/app/leads', icon: UserCheck },
  { id: 'customers', category: 'CRM', label: 'Customer Accounts', description: 'Company accounts, billing info, and status', path: '/app/customers', icon: Building2 },
  { id: 'contacts', category: 'CRM', label: 'People & Contacts', description: 'Individual person records tied to accounts', path: '/app/contacts', icon: Contact },
  { id: 'pipeline', category: 'Sales', label: 'Sales Kanban Pipeline', description: 'Visual deal movement and probability stage view', path: '/app/pipeline', icon: Kanban },
  { id: 'tasks', category: 'Workspace', label: 'Tasks & Action Items', description: 'Action items, assigned tasks, and due dates', path: '/app/tasks', icon: CheckSquare },
  { id: 'activities', category: 'Workspace', label: 'Interaction Log', description: 'Calls, meetings, notes, and emails', path: '/app/activities', icon: Calendar },
  { id: 'support', category: 'Support', label: 'Support Cases & Tickethub', description: 'Customer tickets, SLAs, and resolution tracking', path: '/app/support', icon: LifeBuoy },
  { id: 'campaigns', category: 'Marketing', label: 'Marketing Campaigns', description: 'Lead generation and campaign ROI tracking', path: '/app/campaigns', icon: Megaphone },
  { id: 'reports', category: 'Insights', label: 'Reports & Analytics', description: 'Conversion funnels and custom performance charts', path: '/app/reports', icon: BarChart3 },
  { id: 'settings', category: 'Admin', label: 'Organization Settings', description: 'Organization metadata, security, and integrations', path: '/app/settings', icon: Settings },
  { id: 'roles', category: 'Admin', label: 'Roles & RBAC Permissions', description: 'Fine-grained Role-Based Access Control setup', path: '/app/roles', icon: ShieldCheck }
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filteredItems = SEARCH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].path);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-vynexa-surface-elevated border border-vynexa-border rounded-lg shadow-elevated overflow-hidden text-vynexa-text-primary"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownModal}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-vynexa-border px-3.5 py-3">
          <Search className="h-4 w-4 text-vynexa-text-muted shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CRM modules, navigation, and workspace actions..."
            className="w-full bg-transparent text-sm text-vynexa-text-primary placeholder:text-vynexa-text-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-vynexa-text-muted hover:text-vynexa-text-primary mr-2">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-vynexa-border bg-vynexa-surface px-1.5 font-mono text-[10px] font-medium text-vynexa-text-muted select-none">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-vynexa-text-muted select-none">
              No matching modules or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const IconComponent = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors text-xs select-none ${
                    isSelected ? 'bg-vynexa-surface-secondary border border-vynexa-border/60 text-vynexa-text-primary' : 'text-vynexa-text-secondary hover:bg-vynexa-surface/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded border border-vynexa-border bg-vynexa-surface flex items-center justify-center text-vynexa-text-primary shrink-0">
                      <IconComponent className="h-4 w-4 text-vynexa-text-muted" />
                    </div>
                    <div>
                      <div className="font-semibold text-vynexa-text-primary flex items-center gap-2">
                        {item.label}
                        <span className="text-[10px] font-mono text-vynexa-text-muted px-1.5 py-0.5 rounded border border-vynexa-border/40 bg-vynexa-surface">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-vynexa-text-muted truncate">{item.description}</div>
                    </div>
                  </div>
                  <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-vynexa-border px-1 font-mono text-[10px] text-vynexa-text-muted">
                    ↵
                  </kbd>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3.5 py-2 bg-vynexa-surface border-t border-vynexa-border flex items-center justify-between text-[11px] text-vynexa-text-muted font-mono select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" /> Vynexa Command Palette
          </div>
        </div>
      </div>
    </div>
  );
};
