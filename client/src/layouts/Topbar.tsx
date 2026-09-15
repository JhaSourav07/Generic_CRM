import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, Command, Building, Check, Sparkles } from 'lucide-react';
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
        title: 'Signed Out',
        message: 'You have successfully signed out of your workspace.'
      });
      navigate('/login', { replace: true });
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Sign Out Error',
        message: 'An error occurred while signing out.'
      });
    }
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const orgName = user?.organization?.name || 'Workspace';
  const roleName = user?.role?.name || 'MEMBER';

  // Compute clean breadcrumb path
  const currentPath = location.pathname;
  let pageTitle = 'Dashboard';
  if (currentPath.includes('/leads')) pageTitle = 'Leads Directory';
  else if (currentPath.includes('/customers')) pageTitle = 'Customer Accounts';
  else if (currentPath.includes('/contacts')) pageTitle = 'Contacts Directory';
  else if (currentPath.includes('/pipeline')) pageTitle = 'Sales Pipeline';
  else if (currentPath.includes('/opportunities')) pageTitle = 'Opportunities';
  else if (currentPath.includes('/quotes')) pageTitle = 'Quotes & Proposals';
  else if (currentPath.includes('/orders')) pageTitle = 'Commercial Orders';
  else if (currentPath.includes('/products')) pageTitle = 'Products & Services';
  else if (currentPath.includes('/tasks')) pageTitle = 'Tasks & Actions';
  else if (currentPath.includes('/activities')) pageTitle = 'Interaction Logs';
  else if (currentPath.includes('/follow-ups')) pageTitle = 'Follow-up Reminders';
  else if (currentPath.includes('/documents')) pageTitle = 'Document Management';
  else if (currentPath.includes('/notifications')) pageTitle = 'Notifications';
  else if (currentPath.includes('/support')) pageTitle = 'Support Cases';
  else if (currentPath.includes('/settings')) pageTitle = 'Organization Settings';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-vynexa-border bg-vynexa-surface/90 px-4 backdrop-blur-sm select-none">
        {/* Left Region: Mobile Menu, Breadcrumbs & Organization Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors p-1"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-vynexa-text-muted hidden sm:inline">CRM /</span>
            <span className="font-semibold text-vynexa-text-primary">{pageTitle}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-vynexa-border bg-vynexa-surface-secondary text-xs font-medium text-vynexa-text-secondary select-none">
            <Building className="h-3.5 w-3.5 text-vynexa-text-muted" />
            <span className="font-mono text-vynexa-text-primary text-[11px] truncate max-w-[140px]">{orgName}</span>
            <span className="text-[10px] text-vynexa-text-muted font-mono bg-vynexa-surface px-1 py-0.5 rounded tracking-wider">{roleName}</span>
          </div>
        </div>

        {/* Center Region: Global Search Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full h-8 pl-9 pr-3 rounded-md border border-vynexa-border bg-vynexa-surface-secondary text-xs text-vynexa-text-muted hover:text-vynexa-text-primary hover:border-vynexa-border/80 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-vynexa-text-muted" />
              <span>Search CRM modules, leads, tasks...</span>
            </div>
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-vynexa-border bg-vynexa-surface px-1.5 font-mono text-[10px] font-medium text-vynexa-text-muted">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Region: Search Icon (Mobile), Notifications & User Account */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-1.5 rounded-md text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary transition-colors"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Notifications"
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
            <DropdownItem onClick={() => navigate('/app/settings')}>Profile &amp; Account</DropdownItem>
            <DropdownItem onClick={() => navigate('/app/settings')}>Organization Preferences</DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger onClick={handleSignOut}>Sign Out</DropdownItem>
          </Dropdown>
        </div>
      </header>

      {/* Global Search Command Palette Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
