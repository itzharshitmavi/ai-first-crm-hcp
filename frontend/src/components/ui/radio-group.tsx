import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Radio({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="radio" className={cn('h-4 w-4 accent-[#2563EB]', className)} {...props} />
}
