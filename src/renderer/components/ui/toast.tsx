import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@renderer/lib/utils';

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 rounded-md border p-4 pr-6 shadow-lg trap [&>svg~*]:pl-3 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-6 [&>svg]:opacity-0 group-hover:[&>svg]:opacity-100",
  {
    variants: {
      variant: {
        default: "border-background bg-background text-primary",
        destructive: "border-destructive bg-destructive/20 text-destructive",
        success: "border-success bg-success/20 text-success",
        warning: "border-warning bg-warning/20 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof toastVariants>['variant'];
  className?: string;
}

export const Toast = React.forwardRef<
  HTMLDivElement,
  ToastProps
>(({ className, variant, ...props }, ref) => {
  return (
    <div
      className={cn(toastVariants({ variant, className }))}
      ref={ref}
      {...props}
    >
      <Slot className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4" />
    </div>
  );
});
Toast.displayName = 'Toast';

export const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
ToastAction.displayName = 'ToastAction';

export const ToastTitle = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      className={cn("aspect-none block font-medium truncate", className)}
      ref={ref}
      {...props}
    />
  );
});
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      className={cn("block text-sm [&_a]:underline [&_a]:underline-offset-4", className)}
      ref={ref}
      {...props}
    />
  );
});
ToastDescription.displayName = 'ToastDescription';