import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'
import type { HcpOption } from '../types'

interface Props {
  value: string
  onChange: (value: string) => void
  options: HcpOption[]
  placeholder?: string
  disabled?: boolean
}

export function SearchableHcpSelect({ value, onChange, options, placeholder = 'Search or select HCP...', disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find(
    option => option.name.toLowerCase() === value.toLowerCase()
)
  const filtered = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) {
      return options
    }
    return options.filter((option) =>
      [option.name, option.specialty, option.institution, option.territory].some((part) => part.toLowerCase().includes(lowerQuery)),
    )
  }, [options, query])

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn('h-[42px] w-full justify-between px-3 text-left font-normal', !selected && 'text-slate-400')}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current)
          }
        }}
        disabled={disabled}
      >
        <span>{selected?.name || value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </Button>
      {!disabled && open ? (
        <div className="absolute z-20 mt-2 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search HCP..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="mt-2 max-h-56 overflow-auto rounded-[8px] border border-[#E5E7EB]">
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.name)
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full flex-col gap-1 border-b border-[#F3F4F6] px-3 py-2 text-left last:border-b-0 hover:bg-[#F9FAFB]"
              >
                <span className="text-[14px] font-medium text-slate-900">{option.name}</span>
                <span className="text-[12px] text-slate-500">
                  {option.specialty} · {option.institution} · {option.territory}
                </span>
              </button>
            ))}
            {filtered.length === 0 ? <div className="px-3 py-3 text-[13px] text-slate-500">No HCP found.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
