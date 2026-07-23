import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[#2a2a4e] text-[#aaa]',
  success: 'bg-[#2ed573]/20 text-[#2ed573]',
  warning: 'bg-[#ffa502]/20 text-[#ffa502]',
  error: 'bg-[#ff4757]/20 text-[#ff4757]',
  info: 'bg-[#3b82f6]/20 text-[#3b82f6]',
};

export function Badge({ variant = 'default', className, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn('inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded', badgeVariants[variant], className)} {...props} />;
}
