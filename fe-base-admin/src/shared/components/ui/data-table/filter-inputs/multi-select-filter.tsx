import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import { Separator } from '@shared/components/ui/separator'
import type { FilterValue } from '../types'

interface MultiSelectFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

export function MultiSelectFilter({
  value,
  onChange,
  options,
  placeholder = 'Select...',
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const selected = Array.isArray(value?.value) ? (value!.value as string[]) : []

  function toggle(optValue: string) {
    const next = selected.includes(optValue)
      ? selected.filter(v => v !== optValue)
      : [...selected, optValue]

    if (next.length === 0) {
      onChange(null)
    } else {
      onChange({ type: 'multi-select', value: next, operator: 'eq' })
    }
  }

  function clearAll() {
    onChange(null)
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find(o => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 w-full justify-between px-2 text-xs font-normal',
            selected.length > 0 && 'border-primary/60 text-foreground',
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-0" align="start">
        <div className="max-h-52 overflow-y-auto p-1">
          {options.map(opt => {
            const checked = selected.includes(opt.value)
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                  className="h-3.5 w-3.5"
                />
                <span className="truncate">{opt.label}</span>
                {checked && <Check className="ml-auto h-3 w-3 shrink-0 text-primary" />}
              </label>
            )
          })}
        </div>

        {selected.length > 0 && (
          <>
            <Separator />
            <div className="p-1">
              <button
                onClick={clearAll}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear selection
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
