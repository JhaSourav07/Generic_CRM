import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  name = 'User',
  size = 'md',
  ...props
}) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm'
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border border-vynexa-border bg-vynexa-surface-secondary font-medium text-vynexa-text-primary select-none items-center justify-center',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span className="font-mono">{getInitials(name)}</span>
      )}
    </div>
  );
};
