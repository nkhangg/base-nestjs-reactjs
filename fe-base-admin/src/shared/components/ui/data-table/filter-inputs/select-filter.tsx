import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import type { FilterValue } from '../types'

const ALL = '__all__'

interface SelectFilterProps {
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

export function SelectFilter({ value, onChange, options, placeholder = 'All' }: SelectFilterProps) {
  // URL deserialization converts 'true'/'false' string options to boolean type.
  // Handle both string and boolean to keep the select showing the correct value.
  const rawValue = value?.value
  const current =
    rawValue === true ? 'true' :
    rawValue === false ? 'false' :
    typeof rawValue === 'string' && rawValue !== '' ? rawValue : ALL

  function handleChange(v: string) {
    if (v === ALL) {
      onChange(null)
    } else {
      onChange({ type: 'select', value: v, operator: 'eq' })
    }
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-7 text-xs w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
