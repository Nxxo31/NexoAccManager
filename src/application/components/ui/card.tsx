import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-[#1a1a2e] border border-[#2a2a4e] rounded-md', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-3 py-2 border-b border-[#2a2a4e] text-sm font-medium text-[#eee]', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-3', className)} {...props} />;
}
