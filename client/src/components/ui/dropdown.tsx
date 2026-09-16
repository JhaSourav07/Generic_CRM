import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  close: () => void;
}

const DropdownContext = React.createContext<DropdownContextType>({
  close: () => {}
});

export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  icon,
  danger,
  disabled,
  className
}) => {
  const { close } = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    close();
    onClick?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left font-medium transition-colors rounded-sm select-none cursor-pointer',
        danger
          ? 'text-vynexa-status-danger hover:bg-vynexa-status-danger-bg/40 focus:bg-vynexa-status-danger-bg/40'
          : 'text-vynexa-text-primary hover:bg-vynexa-surface-secondary focus:bg-vynexa-surface-secondary',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
        className
      )}
    >
      {icon && (
        <span className={cn('shrink-0 flex items-center justify-center', danger ? 'text-vynexa-status-danger' : 'text-vynexa-text-muted')}>
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};

export const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('my-1 h-px bg-vynexa-border', className)} />
);

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DropdownCoords {
  top: number;
  left: number;
  isAbove: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'right',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<DropdownCoords | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculateCoords = useCallback((): DropdownCoords | null => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 192; // default w-48

    let left = align === 'right' ? rect.right - menuWidth : rect.left;

    // Viewport horizontal bounds
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    // Only flip upwards if there is practically no space below (< 150px) and plenty of space above
    const spaceBelow = window.innerHeight - rect.bottom;
    const isAbove = spaceBelow < 150 && rect.top > 160;

    const top = isAbove ? rect.top - 4 : rect.bottom + 4;

    return { top, left, isAbove };
  }, [align]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      const initialCoords = calculateCoords();
      if (initialCoords) {
        setCoords(initialCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Keep coordinates updated on resize
  useEffect(() => {
    if (!isOpen) return;
    const updated = calculateCoords();
    if (updated) {
      setCoords(updated);
    }
  }, [isOpen, calculateCoords]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleResize = () => {
      const updated = calculateCoords();
      if (updated) setCoords(updated);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, calculateCoords]);

  const close = () => setIsOpen(false);

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={triggerRef} className="relative inline-block text-left">
        <div onClick={handleTriggerClick} className="cursor-pointer inline-flex">
          {trigger}
        </div>

        {isOpen && coords &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: coords.isAbove ? 'translateY(-100%)' : 'none'
              }}
              className={cn(
                'z-[9999] w-48 max-h-[85vh] overflow-y-auto rounded-md border border-vynexa-border bg-vynexa-surface-elevated p-1 shadow-elevated focus:outline-none select-none animate-in fade-in-50 zoom-in-95 duration-100',
                coords.isAbove ? 'origin-bottom-right' : 'origin-top-right',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>,
            document.body
          )}
      </div>
    </DropdownContext.Provider>
  );
};

