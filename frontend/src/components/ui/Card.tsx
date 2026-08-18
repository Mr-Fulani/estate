import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl border border-slate-200 overflow-hidden',
          hoverable && 'transition-shadow hover:shadow-lg',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
