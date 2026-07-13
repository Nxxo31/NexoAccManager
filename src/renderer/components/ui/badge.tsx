import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@renderer/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border border-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: VariantProps<typeof badgeVariants>['variant'];
  className?: string;
}

export const Badge = React.forwardRef<
  HTMLSpanElement,
  BadgeProps
>(({ className, variant, ...props }, ref) => {
  return (
    <span
      className={cn(badgeVariants({ variant, className }))}
      ref={ref}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';