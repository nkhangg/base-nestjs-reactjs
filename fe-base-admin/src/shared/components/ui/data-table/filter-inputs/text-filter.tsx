import { useEffect, useState, type ChangeEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@shared/utils'
import { useDebounce } from '@shared/hooks'
import { Input } from '@shared/components/ui/input'
import type { FilterValue } from '../types'

interface TextFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  placeholder?: string
  className?: string
  debounce?: number
}

export function TextFilter({
  value,
  onChange,
  placeholder = 'Filter...',
  className,
  debounce = 300,
}: TextFilterProps) {
  const currentValue = typeof value?.value === 'string' ? value.value : ''
  const [localValue, setLocalValue] = useState(currentValue)
  const debounced = useDebounce(localValue, debounce)

  // Sync external clear (e.g. "Clear all filters")
  useEffect(() => {
    setLocalValue(currentValue)
  }, [currentValue])

  useEffect(() => {
    if (debounced === currentValue) return
    if (debounced) {
      onChange({ type: 'text', value: debounced, operator: value?.operator ?? 'contains' })
    } else {
      onChange(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setLocalValue(e.target.value)
  }

  function handleClear() {
    setLocalValue('')
    onChange(null)
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-7 pr-6 text-xs"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
