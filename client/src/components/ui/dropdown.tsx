import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  icon,
  danger,
  disabled
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left font-medium transition-colors rounded-sm select-none',
        danger
          ? 'text-vynexa-status-danger hover:bg-vynexa-status-danger-bg/40'
          : 'text-vynexa-text-primary hover:bg-vynexa-surface-secondary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon && <span className="text-vynexa-text-muted">{icon}</span>}
      {children}
    </button>
  );
};

export const DropdownSeparator: React.FC = () => (
  <div className="my-1 h-px bg-vynexa-border" />
);

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 w-48 rounded-md border border-vynexa-border bg-vynexa-surface-elevated p-1 shadow-elevated focus:outline-none animate-in fade-in-50 duration-150',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
