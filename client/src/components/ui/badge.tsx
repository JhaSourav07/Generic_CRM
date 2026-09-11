import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'emerald' | 'amber' | 'red' | 'blue' | 'slate' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'slate',
  children,
  ...props
}) => {
  const variants = {
    emerald: 'bg-vynexa-status-success-bg/60 text-vynexa-status-success border-vynexa-status-success/30',
    amber: 'bg-vynexa-status-warning-bg/60 text-vynexa-status-warning border-vynexa-status-warning/30',
    red: 'bg-vynexa-status-danger-bg/60 text-vynexa-status-danger border-vynexa-status-danger/30',
    blue: 'bg-vynexa-status-info-bg/60 text-vynexa-status-info border-vynexa-status-info/30',
    slate: 'bg-vynexa-surface-secondary text-vynexa-text-secondary border-vynexa-border',
    outline: 'bg-transparent text-vynexa-text-secondary border-vynexa-border'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors select-none font-mono tracking-tight',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
