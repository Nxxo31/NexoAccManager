import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('h-9 px-3 text-sm bg-[#0d0d1a] border border-[#2a2a4e] rounded text-[#eee] placeholder:text-[#666] focus:outline-none focus:border-[#3b82f6] transition-colors duration-150', className)} {...props} />
  ),
);
Input.displayName = 'Input';
