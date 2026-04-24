import { type ChangeEvent, useRef, useState, useEffect } from 'react'
import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { ColumnVisibilityToggle } from './column-visibility-toggle'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { DensityToggle } from './density-toggle'
import { ExportButton } from './export-button'
import { FilterPresets } from './filter-presets'
import type {
  BulkAction,
  ColumnDef,
  DataTableConfig,
  FilterPreset,
  FilterState,
  TableDensity,
} from './types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface DataTableToolbarProps<T extends Record<string, unknown>> {
  config: DataTableConfig<T>

  // Data (for export, bulk actions)
  data: T[]
  columns: ColumnDef<T>[]

  // Search
  search: string
  onSearch: (value: string) => void

  // Filters
  showFilterRow: boolean
  onToggleFilterRow: () => void
  activeFilterCount: number
  isFiltered: boolean
  onClearAll: () => void
  filters: FilterState

  // Column visibility
  columnVisibility: Record<string, boolean>
  onToggleColumn: (key: string) => void
  onShowAllColumns: () => void

  // Density
  density: TableDensity
  onSetDensity: (d: TableDensity) => void

  // Row selection / bulk actions
  selectedCount: number
  selectedRows: T[]
  onClearSelection: () => void

  // Filter preset apply
  onApplyPreset: (preset: FilterPreset) => void

  // Refresh
  onRefresh?: () => void
  loading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DataTableToolbar<T extends Record<string, unknown>>({
  config,
  data,
  columns,
  search,
  onSearch,
  showFilterRow,
  onToggleFilterRow,
  activeFilterCount,
  isFiltered,
  onClearAll,
  filters,
  columnVisibility,
  onToggleColumn,
  onShowAllColumns,
  density,
  onSetDensity,
  selectedCount,
  selectedRows,
  onClearSelection,
  onApplyPreset,
  onRefresh,
  loading,
}: DataTableToolbarProps<T>) {
  const {
    showSearch = false,
    searchPlaceholder = 'Search...',
    showFilters,
    filterPresets = [],
    showColumnVisibility = false,
    showDensityToggle = false,
    showRefreshButton = false,
    exportable = false,
    exportFilename,
    onExport,
    selectable = false,
    bulkActions = [],
    toolbarLeft,
    toolbarRight,
  } = config

  // Auto-show filter toggle when any column has filterable = true
  const hasFilterableColumns = columns.some(c => c.filterable)
  const shouldShowFilters = showFilters ?? hasFilterableColumns

  // Nothing to render in toolbar
  const hasAnyToolbar =
    showSearch ||
    shouldShowFilters ||
    filterPresets.length > 0 ||
    showColumnVisibility ||
    showDensityToggle ||
    showRefreshButton ||
    exportable ||
    toolbarLeft !== undefined ||
    toolbarRight !== undefined

  if (!hasAnyToolbar) return null

  // Bulk actions mode — overlays the toolbar
  if (selectable && selectedCount > 0) {
    return (
      <DataTableBulkActions
        selectedCount={selectedCount}
        selectedRows={selectedRows}
        actions={bulkActions as BulkAction<T>[]}
        onClearSelection={onClearSelection}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main toolbar row */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Left slot */}
        {toolbarLeft}

        {/* Search */}
        {showSearch && (
          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder={searchPlaceholder}
          />
        )}

        {/* Filter toggle */}
        {shouldShowFilters && (
          <Button
            variant={showFilterRow ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleFilterRow}
            className="h-8 gap-1.5 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Clear filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}

        {/* Right side actions */}
        <div className={cn('flex items-center gap-1.5', !toolbarLeft && !showSearch && !shouldShowFilters ? '' : 'ml-auto')}>
          {showDensityToggle && (
            <DensityToggle density={density} onChange={onSetDensity} />
          )}

          {showColumnVisibility && (
            <ColumnVisibilityToggle
              columns={columns}
              columnVisibility={columnVisibility}
              onToggleColumn={onToggleColumn}
              onShowAllColumns={onShowAllColumns}
            />
          )}

          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 w-8 p-0"
              aria-label="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          )}

          {exportable && (
            <ExportButton
              data={data}
              columns={columns}
              filename={exportFilename}
              onExport={onExport}
            />
          )}

          {/* Right slot */}
          {toolbarRight}
        </div>
      </div>

      {/* Filter presets row */}
      {filterPresets.length > 0 && (
        <FilterPresets
          presets={filterPresets as FilterPreset[]}
          currentFilters={filters}
          currentSearch={search}
          onApply={onApplyPreset}
          onClear={onClearAll}
        />
      )}
    </div>
  )
}

// ── Search input with debounce-free controlled value ──────────────────────────

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external clear
  useEffect(() => {
    setLocal(value)
  }, [value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), 300)
  }

  function handleClear() {
    setLocal('')
    onChange('')
  }

  return (
    <div className="relative min-w-[180px] max-w-xs flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-8 pl-8 pr-7 text-xs"
      />
      {local && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
