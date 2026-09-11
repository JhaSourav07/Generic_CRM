import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Users,
  Contact,
  Kanban,
  TrendingUp,
  FileText,
  ShoppingBag,
  Package,
  CheckSquare,
  Calendar,
  Clock,
  FileCode,
  LifeBuoy,
  Megaphone,
  BarChart3,
  UserCog,
  ShieldCheck,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

const navSections: NavSectionConfig[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'CRM',
    items: [
      { label: 'Leads', path: '/app/leads', icon: UserCheck },
      { label: 'Customers', path: '/app/customers', icon: Building2 },
      { label: 'Contacts', path: '/app/contacts', icon: Contact },
      { label: 'Organizations', path: '/app/organizations', icon: Users }
    ]
  },
  {
    title: 'SALES',
    items: [
      { label: 'Pipeline', path: '/app/pipeline', icon: Kanban },
      { label: 'Opportunities', path: '/app/opportunities', icon: TrendingUp },
      { label: 'Quotes', path: '/app/quotes', icon: FileText },
      { label: 'Orders', path: '/app/orders', icon: ShoppingBag },
      { label: 'Products', path: '/app/products', icon: Package }
    ]
  },
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Tasks', path: '/app/tasks', icon: CheckSquare },
      { label: 'Activities', path: '/app/activities', icon: Calendar },
      { label: 'Follow-ups', path: '/app/follow-ups', icon: Clock },
      { label: 'Documents', path: '/app/documents', icon: FileCode }
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Support Cases', path: '/app/support', icon: LifeBuoy }
    ]
  },
  {
    title: 'MARKETING',
    items: [
      { label: 'Campaigns', path: '/app/campaigns', icon: Megaphone }
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { label: 'Reports', path: '/app/reports', icon: BarChart3 }
    ]
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Users', path: '/app/users', icon: UserCog },
      { label: 'Roles & Permissions', path: '/app/roles', icon: ShieldCheck },
      { label: 'Settings', path: '/app/settings', icon: Settings },
      { label: 'Audit Logs', path: '/app/audit-logs', icon: History }
    ]
  }
];

export interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-vynexa-border bg-vynexa-surface transition-all duration-200 ease-in-out md:static',
        isCollapsed ? 'w-16' : 'w-60',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-vynexa-border shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-7 w-7 rounded-md bg-vynexa-text-primary text-vynexa-bg flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-subtle">
            V
          </div>
          {!isCollapsed && (
            <div className="flex flex-col select-none">
              <span className="text-xs font-bold tracking-wider text-vynexa-text-primary leading-tight font-mono">
                VYNEXA
              </span>
              <span className="text-[10px] text-vynexa-text-muted font-medium tracking-widest font-mono">
                SaaS CRM
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded border border-vynexa-border text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-2 text-[10px] font-mono font-semibold tracking-wider text-vynexa-text-muted select-none">
                {section.title}
              </h4>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors select-none group',
                        isActive
                          ? 'bg-vynexa-surface-secondary text-vynexa-text-primary font-semibold border border-vynexa-border/60 shadow-subtle'
                          : 'text-vynexa-text-secondary hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary/60'
                      )
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <IconComponent className="h-4 w-4 shrink-0 text-vynexa-text-muted group-hover:text-vynexa-text-primary transition-colors" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Organization Status Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-vynexa-border shrink-0 bg-vynexa-surface-secondary/40">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-vynexa-text-muted" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-medium text-vynexa-text-primary truncate">Enterprise SaaS</span>
              <span className="text-[10px] font-mono text-vynexa-text-muted truncate">v1.0.0 — Multi-tenant</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
