import type { ReactNode } from 'react'

// ── Filter ────────────────────────────────────────────────────────────────────

export type FilterType =
  | 'text'
  | 'select'
  | 'multi-select'
  | 'boolean'
  | 'number'
  | 'number-range'
  | 'date'
  | 'date-range'
  | 'datetime'

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'

export type FilterScalarValue = string | number | boolean | null
export type FilterRangeValue = [string, string] | [number, number]
export type FilterArrayValue = string[]

export interface FilterValue {
  type: FilterType
  value: FilterScalarValue | FilterRangeValue | FilterArrayValue
  operator?: FilterOperator
}

export type FilterState = Record<string, FilterValue>

export interface FilterPreset {
  label: string
  filters: FilterState
  search?: string
}

// ── Sort ──────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

// ── Density ───────────────────────────────────────────────────────────────────

export type TableDensity = 'compact' | 'default' | 'comfortable'

// ── Row Selection ─────────────────────────────────────────────────────────────

export interface BulkAction<T = unknown> {
  key: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'destructive'
  onClick: (selectedRows: T[]) => void
}

// ── Column ────────────────────────────────────────────────────────────────────

export interface ColumnDef<T extends Record<string, unknown>> {
  key: string
  header: string

  // Visibility
  hideable?: boolean       // default: true
  defaultHidden?: boolean

  // Sticky pin
  sticky?: 'left' | 'right'

  // Sort
  sortable?: boolean
  defaultSortDirection?: SortDirection

  // Filter
  filterable?: boolean
  filterType?: FilterType
  filterOptions?: { label: string; value: string }[]
  filterPlaceholder?: string
  filterOperators?: FilterOperator[]

  // Render
  width?: string
  minWidth?: string
  className?: string
  headerClassName?: string
  render?: (value: unknown, row: T, index: number) => ReactNode
}

// ── Table Config ──────────────────────────────────────────────────────────────

export interface DataTableConfig<T = unknown> {
  tableId?: string

  // Toolbar
  showSearch?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  showFilters?: boolean           // auto: true khi có filterable column
  showColumnVisibility?: boolean
  showDensityToggle?: boolean
  showRefreshButton?: boolean
  filterPresets?: FilterPreset[]

  // Custom toolbar slots
  toolbarLeft?: ReactNode
  toolbarRight?: ReactNode

  // Pagination
  showPagination?: boolean
  defaultPageSize?: number
  pageSizeOptions?: number[]

  // Row Selection
  selectable?: boolean
  bulkActions?: BulkAction<T>[]

  // Row Expansion
  expandable?: (row: T) => ReactNode

  // Export
  exportable?: boolean
  exportFilename?: string
  onExport?: (data: T[], format: 'csv') => void

  // Persistence — yêu cầu tableId
  persistColumnVisibility?: boolean
  persistPageSize?: boolean
  persistFilters?: boolean
  persistSort?: boolean
  persistDensity?: boolean

  // URL Sync — yêu cầu tableId + Router context
  syncToUrl?: boolean
}

// ── DataTable Props ───────────────────────────────────────────────────────────

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  config?: DataTableConfig<T>

  // Server-side mode — khi có `total` thì delegate filter/sort/page cho caller
  total?: number
  page?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSort?: (sort: SortState | null) => void
  onSearch?: (value: string) => void
  onFilter?: (filters: FilterState) => void
  onRefresh?: () => void

  // Row
  emptyText?: string
  className?: string
  rowKey?: string | ((row: T) => string | number)
  onRowClick?: (row: T) => void
  rowClassName?: (row: T, index: number) => string
}

// ── nestjs-paginate ───────────────────────────────────────────────────────────

export interface NestjsPaginateMeta {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
  sortBy: [string, 'ASC' | 'DESC'][]
  search?: string
  filter?: Record<string, string | string[]>
}

export interface NestjsPaginateResponse<T> {
  data: T[]
  meta: NestjsPaginateMeta
}

export interface NestjsPaginateParams extends Record<string, unknown> {
  page: number
  limit: number
  sortBy?: string
  search?: string
  searchBy?: string[]
  select?: string[]
}

// ── Internal State ────────────────────────────────────────────────────────────

export interface TableState {
  page: number
  pageSize: number
  sort: SortState | null
  filters: FilterState
  search: string
  columnVisibility: Record<string, boolean>
  density: TableDensity
  expandedRows: Set<string | number>
  selectedRows: Set<string | number>
}
