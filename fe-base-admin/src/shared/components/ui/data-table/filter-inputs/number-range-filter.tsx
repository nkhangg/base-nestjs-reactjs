import { useEffect, useState, type ChangeEvent } from 'react'
import { useDebounce } from '@shared/hooks'
import { Input } from '@shared/components/ui/input'
import { cn } from '@shared/utils'
import type { FilterValue } from '../types'

interface NumberRangeFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  className?: string
}

export function NumberRangeFilter({ value, onChange, className }: NumberRangeFilterProps) {
  const range = Array.isArray(value?.value) ? (value!.value as [number, number]) : [null, null]
  const [min, setMin] = useState(range[0] !== null ? String(range[0]) : '')
  const [max, setMax] = useState(range[1] !== null ? String(range[1]) : '')
  const debouncedMin = useDebounce(min, 400)
  const debouncedMax = useDebounce(max, 400)

  useEffect(() => {
    const [r0, r1] = Array.isArray(value?.value) ? (value!.value as [number, number]) : [null, null]
    setMin(r0 !== null ? String(r0) : '')
    setMax(r1 !== null ? String(r1) : '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.value])

  useEffect(() => {
    emit(debouncedMin, debouncedMax)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax])

  function emit(minStr: string, maxStr: string) {
    if (minStr === '' && maxStr === '') {
      onChange(null)
      return
    }
    const minNum = minStr !== '' ? Number(minStr) : null
    const maxNum = maxStr !== '' ? Number(maxStr) : null
    if ((minNum !== null && isNaN(minNum)) || (maxNum !== null && isNaN(maxNum))) return
    if (minNum !== null && maxNum !== null) {
      onChange({ type: 'number-range', value: [minNum, maxNum], operator: 'between' })
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Input
        type="number"
        value={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setMin(e.target.value)}
        placeholder="Min"
        className="h-7 text-xs min-w-0"
      />
      <span className="text-xs text-muted-foreground shrink-0">–</span>
      <Input
        type="number"
        value={max}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setMax(e.target.value)}
        placeholder="Max"
        className="h-7 text-xs min-w-0"
      />
    </div>
  )
}
