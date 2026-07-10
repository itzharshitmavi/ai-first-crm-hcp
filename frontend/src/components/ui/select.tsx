import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-[42px] w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[14px] text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/20',
        className,
      )}
      {...props}
    />
  )
}
