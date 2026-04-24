import { useEffect, useState, type ChangeEvent } from 'react'
import { useDebounce } from '@shared/hooks'
import { Input } from '@shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { cn } from '@shared/utils'
import type { FilterOperator, FilterValue } from '../types'

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
]

interface NumberFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  placeholder?: string
  operators?: FilterOperator[]
  className?: string
}

export function NumberFilter({
  value,
  onChange,
  placeholder = '0',
  operators,
  className,
}: NumberFilterProps) {
  const allowedOps = operators ?? OPERATORS.map(o => o.value)
  const showOperator = allowedOps.length > 1

  const currentNum = typeof value?.value === 'number' ? String(value.value) : ''
  const currentOp: FilterOperator = (value?.operator as FilterOperator) ?? 'eq'

  const [localValue, setLocalValue] = useState(currentNum)
  const [localOp, setLocalOp] = useState<FilterOperator>(currentOp)
  const debounced = useDebounce(localValue, 300)

  useEffect(() => {
    setLocalValue(currentNum)
  }, [currentNum])

  useEffect(() => {
    if (debounced === '' || debounced === currentNum) return
    const num = Number(debounced)
    if (!isNaN(num)) {
      onChange({ type: 'number', value: num, operator: localOp })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  function handleOperatorChange(op: string) {
    const next = op as FilterOperator
    setLocalOp(next)
    if (localValue !== '') {
      const num = Number(localValue)
      if (!isNaN(num)) onChange({ type: 'number', value: num, operator: next })
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setLocalValue(v)
    if (v === '') onChange(null)
  }

  const visibleOps = OPERATORS.filter(o => allowedOps.includes(o.value))

  return (
    <div className={cn('flex gap-1', className)}>
      {showOperator && (
        <Select value={localOp} onValueChange={handleOperatorChange}>
          <SelectTrigger className="h-7 w-14 shrink-0 px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visibleOps.map(op => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input
        type="number"
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="h-7 text-xs min-w-0"
      />
    </div>
  )
}
