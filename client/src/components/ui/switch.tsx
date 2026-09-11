import React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  label,
  className
}) => {
  return (
    <label className={cn('inline-flex items-center gap-2 select-none cursor-pointer text-xs font-medium text-vynexa-text-primary', disabled && 'cursor-not-allowed opacity-50', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-vynexa-border transition-colors duration-150 ease-in-out focus-visible:outline-none',
          checked ? 'bg-vynexa-text-primary border-vynexa-text-primary' : 'bg-vynexa-surface-secondary'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm ring-0 transition duration-150 ease-in-out mt-[1px] ml-[1px]',
            checked ? 'translate-x-4 bg-vynexa-bg' : 'translate-x-0 bg-vynexa-text-secondary'
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
};
