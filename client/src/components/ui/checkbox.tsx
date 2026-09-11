import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked = false, onCheckedChange, id, disabled, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label htmlFor={checkboxId} className={cn('inline-flex items-center gap-2 select-none cursor-pointer text-xs font-medium text-vynexa-text-primary', disabled && 'cursor-not-allowed opacity-50', className)}>
        <div className="relative flex items-center justify-center">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded border border-vynexa-border bg-vynexa-surface-secondary peer-checked:bg-vynexa-text-primary peer-checked:border-vynexa-text-primary transition-colors flex items-center justify-center">
            {checked && <Check className="h-3 w-3 text-vynexa-bg stroke-[3]" />}
          </div>
        </div>
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
