import React from 'react';
import { Search, Bell, Menu, Command, Building } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';

export interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-vynexa-border bg-vynexa-surface/90 px-4 backdrop-blur-sm">
      {/* Left Region: Mobile Menu & Organization Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors p-1"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border border-vynexa-border bg-vynexa-surface-secondary text-xs font-medium text-vynexa-text-secondary select-none">
          <Building className="h-3.5 w-3.5 text-vynexa-text-muted" />
          <span className="font-mono text-vynexa-text-primary text-[11px]">Acme Corp</span>
          <span className="text-[10px] text-vynexa-text-muted font-mono bg-vynexa-surface px-1 py-0.5 rounded">PRO</span>
        </div>
      </div>

      {/* Center Region: Global Search Bar Placeholder */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-vynexa-text-muted pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search leads, deals, contacts... (Cmd+K)"
            className="w-full h-8 pl-9 pr-12 rounded-md border border-vynexa-border bg-vynexa-surface-secondary text-xs text-vynexa-text-primary placeholder:text-vynexa-text-muted focus:outline-none cursor-pointer"
          />
          <kbd className="absolute right-2 top-2 pointer-events-none inline-flex h-4 items-center gap-0.5 rounded border border-vynexa-border bg-vynexa-surface px-1.5 font-mono text-[10px] font-medium text-vynexa-text-muted select-none">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>
      </div>

      {/* Right Region: Action Icons & User Account */}
      <div className="flex items-center gap-3">
        {/* Notifications Icon Placeholder */}
        <button
          title="Notifications"
          className="relative p-1.5 rounded-md text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-vynexa-status-info" />
        </button>

        {/* User Account Dropdown */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer p-0.5 rounded-full hover:ring-1 hover:ring-vynexa-border transition-all">
              <Avatar name="Alex Vance" size="sm" />
            </div>
          }
        >
          <div className="px-3 py-2 border-b border-vynexa-border">
            <p className="text-xs font-semibold text-vynexa-text-primary">Alex Vance</p>
            <p className="text-[11px] text-vynexa-text-muted truncate">alex.vance@acme.com</p>
          </div>
          <DropdownItem onClick={() => {}}>Profile & Settings</DropdownItem>
          <DropdownItem onClick={() => {}}>Organization Config</DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger onClick={() => {}}>Sign Out</DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
};
