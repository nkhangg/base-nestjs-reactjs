import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import type { FilterValue } from '../types'

const ALL = '__all__'

interface BooleanFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  placeholder?: string
  trueLabel?: string
  falseLabel?: string
}

export function BooleanFilter({
  value,
  onChange,
  placeholder = 'All',
  trueLabel = 'Yes',
  falseLabel = 'No',
}: BooleanFilterProps) {
  const current =
    value?.value === true ? 'true' : value?.value === false ? 'false' : ALL

  function handleChange(v: string) {
    if (v === ALL) {
      onChange(null)
    } else {
      onChange({ type: 'boolean', value: v === 'true', operator: 'eq' })
    }
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-7 text-xs w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        <SelectItem value="true">{trueLabel}</SelectItem>
        <SelectItem value="false">{falseLabel}</SelectItem>
      </SelectContent>
    </Select>
  )
}
