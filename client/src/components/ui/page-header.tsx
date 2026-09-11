import React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  className
}) => {
  return (
    <div className={cn('flex flex-col gap-2 pb-5 border-b border-vynexa-border mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} className="mb-1" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-vynexa-text-primary">{title}</h1>
          {description && (
            <p className="mt-0.5 text-xs text-vynexa-text-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
