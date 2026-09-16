import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const CONTAINER_CLASS_REGEX = /^(w-(?!hitespace)|min-w-|max-w-|flex-|shrink|grow|self-|basis-)/;

function extractContainerClasses(className?: string) {
  if (!className) return { containerClasses: '', elementClasses: '' };

  const tokens = className.trim().split(/\s+/);
  const containerTokens: string[] = [];
  const elementTokens: string[] = [];

  for (const token of tokens) {
    if (CONTAINER_CLASS_REGEX.test(token)) {
      containerTokens.push(token);
    } else {
      elementTokens.push(token);
    }
  }

  return {
    containerClasses: containerTokens.join(' '),
    elementClasses: elementTokens.join(' ')
  };
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, containerClassName, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const { containerClasses, elementClasses } = extractContainerClasses(className);
    const hasCustomWidth =
      /(^|\s)(w-(?!hitespace)|flex-1|flex-auto|flex-initial)/.test(containerClasses) ||
      (containerClassName ? /(^|\s)(w-(?!hitespace)|flex-1|flex-auto|flex-initial)/.test(containerClassName) : false);

    return (
      <div
        className={cn(
          hasCustomWidth ? '' : 'w-full',
          (label || error || helperText) && 'space-y-1.5',
          containerClasses,
          containerClassName
        )}
      >
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-vynexa-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-vynexa-text-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-9 w-full rounded-md border border-vynexa-border bg-vynexa-surface-secondary px-3 py-1 text-sm text-vynexa-text-primary placeholder:text-vynexa-text-muted transition-colors focus:border-vynexa-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-vynexa-status-danger focus:border-vynexa-status-danger',
              elementClasses
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-vynexa-text-muted flex items-center justify-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-vynexa-status-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-vynexa-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
