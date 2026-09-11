import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subdued';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-vynexa-text-primary text-vynexa-bg hover:bg-vynexa-white shadow-subtle border border-vynexa-text-primary',
      secondary: 'bg-vynexa-surface-secondary text-vynexa-text-primary hover:bg-vynexa-surface-elevated border border-vynexa-border',
      outline: 'bg-transparent text-vynexa-text-primary hover:bg-vynexa-surface border border-vynexa-border',
      ghost: 'bg-transparent text-vynexa-text-secondary hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary',
      danger: 'bg-vynexa-status-danger-bg text-vynexa-status-danger border border-vynexa-status-danger/30 hover:bg-vynexa-status-danger-bg/80',
      subdued: 'bg-vynexa-surface text-vynexa-text-muted hover:text-vynexa-text-secondary border border-vynexa-border/60'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-10 px-5 text-sm gap-2.5',
      icon: 'h-9 w-9 p-0 justify-center'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
