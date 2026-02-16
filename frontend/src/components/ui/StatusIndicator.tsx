import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface StatusIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'connecting' | 'error';
}

export const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'status-dot',
          {
            'status-online': status === 'online',
            'status-offline': status === 'offline',
            'status-connecting': status === 'connecting',
            'status-error': status === 'error',
          },
          className
        )}
        {...props}
      />
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';
