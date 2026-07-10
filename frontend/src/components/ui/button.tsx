import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]',
    secondary: 'bg-[#F3F4F6] text-slate-900 hover:bg-[#E5E7EB]',
    outline: 'border border-[#E5E7EB] bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  }

  return (
    <button
      className={cn(
        'inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
