import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-vynexa-text-secondary">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-vynexa-border bg-vynexa-surface-secondary px-3 py-2 text-sm text-vynexa-text-primary placeholder:text-vynexa-text-muted transition-colors focus:border-vynexa-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-vynexa-status-danger focus:border-vynexa-status-danger',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-vynexa-status-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-vynexa-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
