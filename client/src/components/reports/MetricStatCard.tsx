import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface MetricStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'blue' | 'red';
}

export const MetricStatCard: React.FC<MetricStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'text-vynexa-text-primary',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    red: 'text-rose-400'
  };

  return (
    <Card className="p-4 bg-vynexa-surface border-vynexa-border hover:border-vynexa-border/80 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-vynexa-text-secondary tracking-tight">
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 text-vynexa-text-muted" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-semibold tracking-tight font-mono ${variantStyles[variant]}`}>
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-vynexa-text-muted truncate">
          {subtitle}
        </p>
      )}
    </Card>
  );
};
