import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex items-center border-b border-vynexa-border space-x-6', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-2.5 text-xs font-medium transition-colors flex items-center gap-1.5 select-none focus-visible:outline-none',
              isActive
                ? 'text-vynexa-text-primary font-semibold'
                : 'text-vynexa-text-muted hover:text-vynexa-text-secondary'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-mono font-medium',
                  isActive
                    ? 'bg-vynexa-surface-secondary text-vynexa-text-primary border border-vynexa-border'
                    : 'bg-vynexa-surface text-vynexa-text-muted'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-vynexa-text-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
