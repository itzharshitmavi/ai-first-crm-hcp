import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

interface Props {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
  suggestions?: string[]
  className?: string
  disabled?: boolean
}

export function MultiValueInput({ label, placeholder, values, onChange, suggestions = [], className, disabled = false }: Props) {
  const [draft, setDraft] = useState('')

  const commitValue = (nextValue: string) => {
    const normalized = nextValue.trim()
    if (!normalized || values.includes(normalized)) {
      return
    }
    onChange([...values, normalized])
    setDraft('')
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitValue(draft)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button type="button" variant="outline" className="h-[42px] px-3" onClick={() => commitValue(draft)} disabled={disabled}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => commitValue(suggestion)}
              className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 text-[12px] text-slate-600 hover:bg-white disabled:cursor-not-allowed"
              disabled={disabled}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={value} className="inline-flex items-center rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-medium text-[#1D4ED8]">
              {value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
