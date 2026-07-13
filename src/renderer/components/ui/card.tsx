import * as React from 'react';
import { cn } from '@renderer/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Card.displayName = 'Card';