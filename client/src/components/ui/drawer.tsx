import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-150"
      />

      <div
        className={cn(
          'fixed inset-y-0 z-10 flex max-w-full border-vynexa-border bg-vynexa-surface-elevated shadow-elevated transition-transform duration-200',
          side === 'right' ? 'right-0 border-l w-96' : 'left-0 border-r w-96'
        )}
      >
        <div className="flex h-full w-full flex-col p-6">
          <div className="flex items-center justify-between pb-4 border-b border-vynexa-border">
            {title ? (
              <h3 className="text-sm font-semibold text-vynexa-text-primary tracking-tight">{title}</h3>
            ) : <div />}
            <button
              onClick={onClose}
              className="text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close drawer</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
};
