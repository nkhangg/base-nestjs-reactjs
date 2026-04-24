import type { ColumnDef, FilterState, FilterValue } from './types'
import {
  TextFilter,
  SelectFilter,
  BooleanFilter,
  NumberFilter,
  NumberRangeFilter,
  MultiSelectFilter,
  DateFilter,
  DateRangeFilter,
  DatetimeFilter,
} from './filter-inputs'

// ── Props ─────────────────────────────────────────────────────────────────────

interface DataTableFilterRowProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  filters: FilterState
  onFilter: (key: string, value: FilterValue | null) => void
  columnVisibility: Record<string, boolean>
  prefixCells?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DataTableFilterRow<T extends Record<string, unknown>>({
  columns,
  filters,
  onFilter,
  columnVisibility,
  prefixCells = 0,
}: DataTableFilterRowProps<T>) {
  const visible = columns.filter(col => columnVisibility[col.key] !== false)

  return (
    <tr className="border-b border-border bg-muted/30">
      {Array.from({ length: prefixCells }).map((_, i) => (
        <th key={`prefix-${i}`} />
      ))}
      {visible.map(col => (
        <th key={col.key} className="px-3 py-2 font-normal align-top">
          {col.filterable && (
            <FilterCell
              col={col}
              value={filters[col.key]}
              onChange={v => onFilter(col.key, v)}
            />
          )}
        </th>
      ))}
    </tr>
  )
}

// ── Filter cell — resolves which input to render ──────────────────────────────

interface FilterCellProps<T extends Record<string, unknown>> {
  col: ColumnDef<T>
  value: FilterValue | undefined
  onChange: (value: FilterValue | null) => void
}

function FilterCell<T extends Record<string, unknown>>({
  col,
  value,
  onChange,
}: FilterCellProps<T>) {
  const type = resolveFilterType(col)
  const options = col.filterOptions ?? []
  const placeholder = col.filterPlaceholder

  switch (type) {
    case 'select':
      return (
        <SelectFilter
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder ?? 'All'}
        />
      )

    case 'multi-select':
      return (
        <MultiSelectFilter
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder ?? 'Select...'}
        />
      )

    case 'boolean':
      return <BooleanFilter value={value} onChange={onChange} placeholder={placeholder ?? 'All'} />

    case 'number':
      return (
        <NumberFilter
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? '0'}
          operators={col.filterOperators}
        />
      )

    case 'number-range':
      return <NumberRangeFilter value={value} onChange={onChange} />

    case 'date':
      return (
        <DateFilter value={value} onChange={onChange} placeholder={placeholder ?? 'Pick date...'} />
      )

    case 'date-range':
      return (
        <DateRangeFilter
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? 'Pick range...'}
        />
      )

    case 'datetime':
      return (
        <DatetimeFilter
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? 'Pick datetime...'}
        />
      )

    case 'text':
    default:
      return (
        <TextFilter
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? 'Filter...'}
        />
      )
  }
}

// ── Resolve filter type from column config ────────────────────────────────────

function resolveFilterType<T extends Record<string, unknown>>(
  col: ColumnDef<T>,
): NonNullable<ColumnDef<T>['filterType']> {
  if (col.filterType) return col.filterType
  // Auto-detect: if options provided → select; otherwise text
  if (col.filterOptions && col.filterOptions.length > 0) return 'select'
  return 'text'
}
