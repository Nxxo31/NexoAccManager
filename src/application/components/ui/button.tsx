import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[#3b82f6] hover:bg-[#2563eb] text-white',
  secondary: 'bg-[#1a1a2e] hover:bg-[#2a2a4e] text-[#eee] border border-[#2a2a4e]',
  ghost: 'hover:bg-[#1a1a2e] text-[#aaa] hover:text-[#eee] bg-transparent',
  danger: 'bg-[#ff4757] hover:bg-[#e03545] text-white',
  outline: 'border border-[#2a2a4e] hover:border-[#3b82f6] text-[#eee] bg-transparent',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2 text-xs gap-1 rounded',
  md: 'h-9 px-3 text-sm gap-1.5 rounded',
  lg: 'h-11 px-5 text-sm gap-2 rounded-md',
  icon: 'h-8 w-8 rounded',
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button ref={ref} className={cn('inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#3b82f6]', variants[variant], sizes[size], className)} {...props} />
  ),
);
Button.displayName = 'Button';
