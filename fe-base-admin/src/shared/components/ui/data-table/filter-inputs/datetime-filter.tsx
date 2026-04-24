import { useState, type ChangeEvent } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format, isValid, parseISO, setHours, setMinutes } from 'date-fns'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Calendar } from '@shared/components/ui/calendar'
import { Input } from '@shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import type { FilterValue } from '../types'

interface DatetimeFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  placeholder?: string
}

function toDate(v: unknown): Date | undefined {
  if (!v || typeof v !== 'string') return undefined
  const d = parseISO(v)
  return isValid(d) ? d : undefined
}

export function DatetimeFilter({
  value,
  onChange,
  placeholder = 'Pick datetime...',
}: DatetimeFilterProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value?.value)

  const timeStr = selected ? format(selected, 'HH:mm') : '00:00'

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(null)
      return
    }
    const [hh = 0, mm = 0] = timeStr.split(':').map(Number)
    const withTime = setMinutes(setHours(day, hh), mm)
    onChange({
      type: 'datetime',
      value: format(withTime, "yyyy-MM-dd'T'HH:mm:ss"),
      operator: value?.operator ?? 'eq',
    })
  }

  function handleTimeChange(e: ChangeEvent<HTMLInputElement>) {
    const [hh = 0, mm = 0] = e.target.value.split(':').map(Number)
    const base = selected ?? new Date()
    const withTime = setMinutes(setHours(base, hh), mm)
    onChange({
      type: 'datetime',
      value: format(withTime, "yyyy-MM-dd'T'HH:mm:ss"),
      operator: value?.operator ?? 'eq',
    })
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
            {selected ? format(selected, 'dd/MM/yyyy HH:mm') : placeholder}
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
          onSelect={handleDaySelect}
          initialFocus
        />
        <div className="border-t p-3">
          <label className="mb-1.5 block text-xs text-muted-foreground">Time</label>
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="h-7 text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
