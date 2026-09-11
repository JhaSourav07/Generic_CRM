import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options = [], error, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-vynexa-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-9 w-full appearance-none rounded-md border border-vynexa-border bg-vynexa-surface-secondary px-3 py-1 pr-8 text-sm text-vynexa-text-primary transition-colors focus:border-vynexa-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-vynexa-status-danger',
              className
            )}
            {...props}
          >
            {children ? (
              children
            ) : (
              options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-vynexa-surface-elevated text-vynexa-text-primary">
                  {opt.label}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-vynexa-text-muted pointer-events-none" />
        </div>
        {error && <p className="text-xs text-vynexa-status-danger font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
