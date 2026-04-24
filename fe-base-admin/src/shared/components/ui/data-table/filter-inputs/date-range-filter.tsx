import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Calendar } from '@shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import type { FilterValue } from '../types'

interface DateRangeFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  placeholder?: string
}

function toDate(v: unknown): Date | undefined {
  if (!v || typeof v !== 'string') return undefined
  const d = parseISO(v)
  return isValid(d) ? d : undefined
}

export function DateRangeFilter({
  value,
  onChange,
  placeholder = 'Pick range...',
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)

  const range = Array.isArray(value?.value) ? (value!.value as [string, string]) : null
  const dateRange: DateRange | undefined = range
    ? { from: toDate(range[0]), to: toDate(range[1]) }
    : undefined

  function handleSelect(r: DateRange | undefined) {
    if (!r?.from) {
      onChange(null)
      return
    }
    if (r.from && r.to) {
      onChange({
        type: 'date-range',
        value: [format(r.from, 'yyyy-MM-dd'), format(r.to, 'yyyy-MM-dd')],
        operator: 'between',
      })
      setOpen(false)
    } else {
      // From selected, waiting for To — keep popover open
      onChange({
        type: 'date-range',
        value: [format(r.from, 'yyyy-MM-dd'), format(r.from, 'yyyy-MM-dd')],
        operator: 'between',
      })
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
  }

  let label = placeholder
  if (dateRange?.from) {
    label = dateRange.to
      ? `${format(dateRange.from, 'dd/MM/yy')} – ${format(dateRange.to, 'dd/MM/yy')}`
      : format(dateRange.from, 'dd/MM/yyyy')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 w-full justify-start px-2 text-xs font-normal',
            !dateRange?.from && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3 shrink-0" />
          <span className="flex-1 truncate text-left">{label}</span>
          {dateRange?.from && (
            <X
              className="ml-1 h-3 w-3 shrink-0 opacity-60 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
