import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'badge',
          {
            'badge-primary': variant === 'primary',
            'badge-success': variant === 'success',
            'badge-warning': variant === 'warning',
            'badge-error': variant === 'error',
            'badge-neutral': variant === 'neutral',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
