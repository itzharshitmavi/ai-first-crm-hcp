import type { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
  required?: boolean
}

export function FormField({ label, children, required }: Props) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1">
        <span className="text-[13px] font-medium text-slate-700">{label}</span>
        {required ? <span className="text-[13px] font-medium text-rose-500">*</span> : null}
      </div>
      {children}
    </div>
  )
}
