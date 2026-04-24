import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Calendar } from '@shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import type { FilterValue } from '../types'

interface DateFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  placeholder?: string
}

function toDate(v: unknown): Date | undefined {
  if (!v || typeof v !== 'string') return undefined
  const d = parseISO(v)
  return isValid(d) ? d : undefined
}

export function DateFilter({ value, onChange, placeholder = 'Pick date...' }: DateFilterProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value?.value)

  function handleSelect(day: Date | undefined) {
    if (!day) {
      onChange(null)
    } else {
      onChange({ type: 'date', value: format(day, 'yyyy-MM-dd'), operator: value?.operator ?? 'eq' })
    }
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 w-full justify-start px-2 text-xs font-normal',
            !selected && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3 shrink-0" />
          <span className="flex-1 truncate text-left">
            {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
          </span>
          {selected && (
            <X
              className="ml-1 h-3 w-3 shrink-0 opacity-60 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
