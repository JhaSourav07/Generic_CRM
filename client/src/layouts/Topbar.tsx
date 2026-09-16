import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Command,
  Building,
  Sparkles,
  Plus,
  UserCheck,
  Building2,
  Contact,
  TrendingUp,
  FileText,
  ShoppingBag,
  Package,
  CheckSquare,
  Calendar,
  LifeBuoy
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { notificationsService } from '@/services/notifications.service';

export interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const count = await notificationsService.getUnreadCount();
        if (mounted) setUnreadCount(count);
      } catch (_err) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        type: 'info',
        title: 'Signed out',
        message: 'You have signed out of your workspace.'
      });
      navigate('/login', { replace: true });
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Sign out failed',
        message: 'Could not sign out. Please try again.'
      });
    }
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const orgName = user?.organization?.name || 'Workspace';
  const roleName = user?.role?.name || 'MEMBER';

  // Compute clean breadcrumb hierarchy
  const currentPath = location.pathname;
  let sectionName = 'CRM';
  let pageTitle = 'Dashboard';

  if (currentPath.includes('/dashboard')) {
    sectionName = 'Overview';
    pageTitle = 'Dashboard';
  } else if (currentPath.includes('/leads')) {
    sectionName = 'CRM';
    pageTitle = currentPath.split('/leads/')[1] ? 'Lead details' : 'Leads';
  } else if (currentPath.includes('/customers')) {
    sectionName = 'CRM';
    pageTitle = currentPath.split('/customers/')[1] ? 'Customer details' : 'Customers';
  } else if (currentPath.includes('/contacts')) {
    sectionName = 'CRM';
    pageTitle = currentPath.split('/contacts/')[1] ? 'Contact details' : 'Contacts';
  } else if (currentPath.includes('/pipeline')) {
    sectionName = 'Sales';
    pageTitle = 'Sales Pipeline';
  } else if (currentPath.includes('/opportunities')) {
    sectionName = 'Sales';
    pageTitle = currentPath.split('/opportunities/')[1] ? 'Opportunity details' : 'Opportunities';
  } else if (currentPath.includes('/quotes')) {
    sectionName = 'Sales';
    pageTitle = currentPath.split('/quotes/')[1] ? 'Quote details' : 'Quotes';
  } else if (currentPath.includes('/orders')) {
    sectionName = 'Sales';
    pageTitle = currentPath.split('/orders/')[1] ? 'Order details' : 'Orders';
  } else if (currentPath.includes('/products')) {
    sectionName = 'Sales';
    pageTitle = currentPath.split('/products/')[1] ? 'Product details' : 'Products';
  } else if (currentPath.includes('/tasks')) {
    sectionName = 'Workspace';
    pageTitle = 'Tasks';
  } else if (currentPath.includes('/activities')) {
    sectionName = 'Workspace';
    pageTitle = 'Activities';
  } else if (currentPath.includes('/follow-ups')) {
    sectionName = 'Workspace';
    pageTitle = 'Follow-ups';
  } else if (currentPath.includes('/documents')) {
    sectionName = 'Workspace';
    pageTitle = currentPath.split('/documents/')[1] ? 'Document details' : 'Documents';
  } else if (currentPath.includes('/notifications')) {
    sectionName = 'Workspace';
    pageTitle = 'Notifications';
  } else if (currentPath.includes('/support')) {
    sectionName = 'Support';
    pageTitle = currentPath.includes('/support-cases/') ? 'Support request details' : 'Support';
  } else if (currentPath.includes('/campaigns')) {
    sectionName = 'Marketing';
    pageTitle = currentPath.split('/campaigns/')[1] ? 'Campaign details' : 'Campaigns';
  } else if (currentPath.includes('/reports')) {
    sectionName = 'Insights';
    pageTitle = 'Reports';
  } else if (currentPath.includes('/users')) {
    sectionName = 'Admin';
    pageTitle = 'Users';
  } else if (currentPath.includes('/roles')) {
    sectionName = 'Admin';
    pageTitle = 'Roles & Permissions';
  } else if (currentPath.includes('/settings')) {
    sectionName = 'Admin';
    pageTitle = 'Settings';
  } else if (currentPath.includes('/audit-logs')) {
    sectionName = 'Admin';
    pageTitle = 'Audit Log';
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-vynexa-border bg-vynexa-surface/90 px-3 sm:px-4 backdrop-blur-sm select-none">
        {/* Left Region: Mobile Menu, Breadcrumbs & Organization Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors p-1 shrink-0"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs truncate">
            <span className="font-mono text-vynexa-text-muted hidden sm:inline">{sectionName} /</span>
            <span className="font-semibold text-vynexa-text-primary truncate">{pageTitle}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 rounded border border-vynexa-border bg-vynexa-surface-secondary text-xs font-medium text-vynexa-text-secondary select-none shrink-0">
            <Building className="h-3 w-3 text-vynexa-text-muted" />
            <span className="font-mono text-vynexa-text-primary text-[11px] truncate max-w-[130px]">{orgName}</span>
            <span className="text-[9px] text-vynexa-text-muted font-mono bg-vynexa-surface px-1 py-0.2 rounded tracking-wider">{roleName}</span>
          </div>
        </div>

        {/* Center Region: Global Search Trigger */}
        <div className="flex-1 max-w-md mx-3 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full h-8 pl-3 pr-2.5 rounded-md border border-vynexa-border bg-vynexa-surface-secondary text-xs text-vynexa-text-muted hover:text-vynexa-text-primary hover:border-vynexa-border/80 flex items-center justify-between transition-colors cursor-pointer"
            aria-label="Open search"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
              <span className="truncate">Search customers, leads, contacts, and more...</span>
            </div>
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-vynexa-border bg-vynexa-surface px-1 font-mono text-[10px] font-medium text-vynexa-text-muted shrink-0">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Region: Quick Create, Search (Mobile), Notifications & User Account */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global Quick Create Menu */}
          <Dropdown
            trigger={
              <button
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-vynexa-border bg-vynexa-surface-secondary text-xs font-medium text-vynexa-text-primary hover:bg-vynexa-surface-secondary/80 hover:border-vynexa-border/80 transition-colors"
                title="Create record"
                aria-label="Create record"
              >
                <Plus className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span className="hidden sm:inline">Create</span>
              </button>
            }
          >
            <div className="px-3 py-1 text-[10px] font-mono font-semibold text-vynexa-text-muted uppercase border-b border-vynexa-border select-none">
              Quick create
            </div>
            <DropdownItem onClick={() => navigate('/app/leads?action=create')}>
              <div className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Add lead</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/customers?action=create')}>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Add customer</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/contacts?action=create')}>
              <div className="flex items-center gap-2">
                <Contact className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Add contact</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/opportunities?action=create')}>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Add opportunity</span>
              </div>
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => navigate('/app/quotes?action=create')}>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Create quote</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/orders?action=create')}>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Create order</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/products?action=create')}>
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Add product</span>
              </div>
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => navigate('/app/tasks?action=create')}>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Add task</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/activities?action=create')}>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>Log activity</span>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/app/support?action=create')}>
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-3.5 w-3.5 text-vynexa-text-muted" />
                <span>New support request</span>
              </div>
            </DropdownItem>
          </Dropdown>

          {/* Search Icon Trigger on Mobile */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-1.5 rounded-md text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary transition-colors"
            title="Search"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Notifications"
              aria-label="Notifications"
              className="relative p-1.5 rounded-md text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              )}
            </button>

            <NotificationPopover
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              unreadCount={unreadCount}
              onCountChange={setUnreadCount}
            />
          </div>

          {/* User Account Dropdown */}
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 cursor-pointer p-0.5 rounded-full hover:ring-1 hover:ring-vynexa-border transition-all">
                <Avatar name={displayName} size="sm" />
              </div>
            }
          >
            <div className="px-3 py-2 border-b border-vynexa-border">
              <p className="text-xs font-semibold text-vynexa-text-primary">{displayName}</p>
              <p className="text-[11px] text-vynexa-text-muted truncate">{displayEmail}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-vynexa-text-secondary">
                <Sparkles className="h-3 w-3 text-vynexa-text-muted" />
                <span>{orgName} • {roleName}</span>
              </div>
            </div>
            <DropdownItem onClick={() => navigate('/app/settings')}>Profile &amp; account</DropdownItem>
            <DropdownItem onClick={() => navigate('/app/settings')}>Company settings</DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger onClick={handleSignOut}>Sign out</DropdownItem>
          </Dropdown>
        </div>
      </header>

      {/* Global Search Command Palette Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
