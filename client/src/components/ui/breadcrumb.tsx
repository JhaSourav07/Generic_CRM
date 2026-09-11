import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1.5 text-xs text-vynexa-text-muted font-medium select-none', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />}
            {isLast || !item.href ? (
              <span className={cn('text-vynexa-text-primary font-semibold', isLast && 'text-vynexa-text-primary')}>
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="hover:text-vynexa-text-secondary transition-colors"
              >
                {item.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
