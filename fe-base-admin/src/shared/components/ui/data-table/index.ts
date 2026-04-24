// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  FilterType,
  FilterOperator,
  FilterScalarValue,
  FilterRangeValue,
  FilterArrayValue,
  FilterValue,
  FilterState,
  FilterPreset,
  SortDirection,
  SortState,
  TableDensity,
  BulkAction,
  ColumnDef,
  DataTableConfig,
  DataTableProps,
  NestjsPaginateMeta,
  NestjsPaginateResponse,
  NestjsPaginateParams,
  TableState,
} from './types'

// ── Utils ─────────────────────────────────────────────────────────────────────
export {
  getNestedValue,
  compareValues,
  buildPageNumbers,
  buildNestjsPaginateParams,
  matchesFilter,
  exportToCsv,
  DENSITY_CELL_CLASSES,
  DENSITY_HEADER_CLASSES,
} from './utils'

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useDataTable } from './hooks/use-data-table'
export type { UseDataTableReturn } from './hooks/use-data-table'

export { useTableStorage } from './hooks/use-table-storage'
export type { TableStorageReturn } from './hooks/use-table-storage'

export { useTableUrlSync } from './hooks/use-table-url-sync'
export type { UrlSyncState, UrlSyncActions } from './hooks/use-table-url-sync'

// ── Filter Inputs ─────────────────────────────────────────────────────────────
export {
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

// ── Sub-components ────────────────────────────────────────────────────────────
export { DataTableFilterRow } from './data-table-filter-row'
export { DataTableToolbar } from './data-table-toolbar'
export { DataTablePagination } from './data-table-pagination'
export { DataTableBulkActions } from './data-table-bulk-actions'
export { ColumnVisibilityToggle } from './column-visibility-toggle'
export { DensityToggle } from './density-toggle'
export { FilterPresets } from './filter-presets'
export { ExportButton } from './export-button'

// ── Component ─────────────────────────────────────────────────────────────────
export { DataTable } from './data-table'
