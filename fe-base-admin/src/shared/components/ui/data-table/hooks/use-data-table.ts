import { useState, useCallback, useMemo } from 'react'
import { APP_CONFIG } from '@config/app.config'
import type {
  DataTableConfig,
  FilterState,
  FilterValue,
  SortState,
  TableDensity,
  NestjsPaginateParams,
  ColumnDef,
} from '../types'
import { buildNestjsPaginateParams } from '../utils'
import { useTableStorage } from './use-table-storage'
import { useTableUrlSync } from './use-table-url-sync'

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseDataTableReturn<T extends Record<string, unknown>> {
  // Pagination
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void

  // Sort
  sort: SortState | null
  setSort: (sort: SortState | null) => void
  handleSortToggle: (key: string) => void

  // Filter
  filters: FilterState
  setFilter: (key: string, value: FilterValue | null) => void
  clearFilter: (key: string) => void
  clearAllFilters: () => void

  // Search
  search: string
  setSearch: (value: string) => void

  // Column visibility
  columnVisibility: Record<string, boolean>
  initColumnVisibility: (columns: ColumnDef<T>[]) => void
  toggleColumn: (key: string) => void
  showAllColumns: () => void
  isColumnVisible: (key: string) => boolean

  // Row selection
  selectedRows: Set<string | number>
  toggleRow: (id: string | number) => void
  toggleAll: (ids: (string | number)[]) => void
  clearSelection: () => void
  isSelected: (id: string | number) => boolean
  isAllSelected: (ids: (string | number)[]) => boolean
  isIndeterminate: (ids: (string | number)[]) => boolean

  // Density
  density: TableDensity
  setDensity: (density: TableDensity) => void

  // Row expansion
  expandedRows: Set<string | number>
  toggleExpanded: (id: string | number) => void
  isExpanded: (id: string | number) => boolean
  closeAllExpanded: () => void

  // Computed
  isFiltered: boolean
  activeFilterCount: number

  // Config passthrough (for DataTable prop)
  config: DataTableConfig<T>

  // nestjs-paginate params builder
  buildQueryParams: (searchBy?: string[]) => NestjsPaginateParams

  // Reset everything
  resetAll: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDataTable<T extends Record<string, unknown>>(
  config: DataTableConfig<T> = {},
): UseDataTableReturn<T> {
  const {
    tableId = '',
    syncToUrl = false,
    defaultPageSize = APP_CONFIG.pagination.defaultPageSize,
  } = config

  // ── Persistence layer ──
  const storage = useTableStorage({
    tableId,
    persistColumnVisibility: config.persistColumnVisibility,
    persistPageSize: config.persistPageSize,
    persistFilters: config.persistFilters,
    persistSort: config.persistSort,
    persistDensity: config.persistDensity,
  })

  const resolvedDefaultPageSize = storage.pageSize ?? defaultPageSize

  // ── URL sync layer (always called — rules of hooks) ──
  const url = useTableUrlSync(syncToUrl && !!tableId, resolvedDefaultPageSize)

  // ── Local state (active when syncToUrl is false) ──
  const [localPage, setLocalPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(resolvedDefaultPageSize)
  const [localSort, setLocalSort] = useState<SortState | null>(storage.sort ?? null)
  const [localSearch, setLocalSearch] = useState('')
  const [localFilters, setLocalFilters] = useState<FilterState>(storage.filters ?? {})

  // ── Non-URL state (always local) ──
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    storage.columnVisibility ?? {},
  )
  const [density, setDensityState] = useState<TableDensity>(storage.density ?? 'default')
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())

  // ── Active state — URL takes over when syncToUrl is enabled ──
  const page = syncToUrl ? url.page : localPage
  const pageSize = syncToUrl ? url.pageSize : localPageSize
  const sort = syncToUrl ? url.sort : localSort
  const search = syncToUrl ? url.search : localSearch
  const filters = syncToUrl ? url.filters : localFilters

  // ── Setters ───────────────────────────────────────────────────────────────

  const setPage = useCallback(
    (p: number) => {
      if (syncToUrl) url.setPage(p)
      else setLocalPage(p)
    },
    [syncToUrl, url],
  )

  const setPageSize = useCallback(
    (size: number) => {
      if (syncToUrl) {
        url.setPageSize(size)
      } else {
        setLocalPageSize(size)
        setLocalPage(1)
      }
      storage.savePageSize?.(size)
    },
    [syncToUrl, url, storage],
  )

  const setSort = useCallback(
    (s: SortState | null) => {
      if (syncToUrl) url.setSort(s)
      else setLocalSort(s)
      storage.saveSort?.(s)
    },
    [syncToUrl, url, storage],
  )

  const handleSortToggle = useCallback(
    (key: string) => {
      const next: SortState | null =
        sort?.key === key
          ? sort.direction === 'asc'
            ? { key, direction: 'desc' }
            : null
          : { key, direction: 'asc' }
      setSort(next)
      if (!syncToUrl) setLocalPage(1)
    },
    [sort, setSort, syncToUrl],
  )

  const setSearch = useCallback(
    (value: string) => {
      if (syncToUrl) url.setSearch(value)
      else { setLocalSearch(value); setLocalPage(1) }
    },
    [syncToUrl, url],
  )

  const setFilter = useCallback(
    (key: string, value: FilterValue | null) => {
      if (syncToUrl) {
        url.setFilter(key, value)
      } else {
        setLocalFilters(prev => {
          if (!value) {
            const { [key]: _removed, ...rest } = prev
            return rest
          }
          return { ...prev, [key]: value }
        })
        setLocalPage(1)
      }
      // Persist after state update
      if (config.persistFilters && storage.saveFilters) {
        const current = syncToUrl ? url.filters : localFilters
        if (!value) {
          const { [key]: _removed, ...rest } = current
          storage.saveFilters(rest)
        } else {
          storage.saveFilters({ ...current, [key]: value })
        }
      }
    },
    [syncToUrl, url, config.persistFilters, storage, localFilters],
  )

  const clearFilter = useCallback(
    (key: string) => setFilter(key, null),
    [setFilter],
  )

  const clearAllFilters = useCallback(
    () => {
      if (syncToUrl) url.clearFilters()
      else { setLocalFilters({}); setLocalSearch(''); setLocalPage(1) }
      storage.saveFilters?.({})
    },
    [syncToUrl, url, storage],
  )

  // ── Column visibility ─────────────────────────────────────────────────────

  const initColumnVisibility = useCallback(
    (columns: ColumnDef<T>[]) => {
      setColumnVisibility(prev => {
        const next: Record<string, boolean> = {}
        for (const col of columns) {
          // Persisted value wins; fall back to defaultHidden
          next[col.key] = prev[col.key] !== undefined
            ? prev[col.key]
            : col.defaultHidden !== true
        }
        return next
      })
    },
    [],
  )

  const toggleColumn = useCallback(
    (key: string) => {
      setColumnVisibility(prev => {
        const next = { ...prev, [key]: !prev[key] }
        storage.saveColumnVisibility?.(next)
        return next
      })
    },
    [storage],
  )

  const showAllColumns = useCallback(
    () => {
      setColumnVisibility(prev => {
        const next = Object.fromEntries(Object.keys(prev).map(k => [k, true]))
        storage.saveColumnVisibility?.(next)
        return next
      })
    },
    [storage],
  )

  const isColumnVisible = useCallback(
    (key: string) => columnVisibility[key] !== false,
    [columnVisibility],
  )

  // ── Row selection ─────────────────────────────────────────────────────────

  const toggleRow = useCallback(
    (id: string | number) => {
      setSelectedRows(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [],
  )

  const toggleAll = useCallback(
    (ids: (string | number)[]) => {
      setSelectedRows(prev => {
        const allSelected = ids.every(id => prev.has(id))
        const next = new Set(prev)
        if (allSelected) ids.forEach(id => next.delete(id))
        else ids.forEach(id => next.add(id))
        return next
      })
    },
    [],
  )

  const clearSelection = useCallback(() => setSelectedRows(new Set()), [])

  const isSelected = useCallback(
    (id: string | number) => selectedRows.has(id),
    [selectedRows],
  )

  const isAllSelected = useCallback(
    (ids: (string | number)[]) => ids.length > 0 && ids.every(id => selectedRows.has(id)),
    [selectedRows],
  )

  const isIndeterminate = useCallback(
    (ids: (string | number)[]) => {
      const count = ids.filter(id => selectedRows.has(id)).length
      return count > 0 && count < ids.length
    },
    [selectedRows],
  )

  // ── Density ───────────────────────────────────────────────────────────────

  const setDensity = useCallback(
    (d: TableDensity) => {
      setDensityState(d)
      storage.saveDensity?.(d)
    },
    [storage],
  )

  // ── Row expansion ─────────────────────────────────────────────────────────

  const toggleExpanded = useCallback(
    (id: string | number) => {
      setExpandedRows(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [],
  )

  const isExpanded = useCallback(
    (id: string | number) => expandedRows.has(id),
    [expandedRows],
  )

  const closeAllExpanded = useCallback(() => setExpandedRows(new Set()), [])

  // ── Computed ──────────────────────────────────────────────────────────────

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter(f => {
        const v = f.value
        if (v === null || v === undefined || v === '') return false
        if (Array.isArray(v)) return v.length > 0
        return true
      }).length + (search ? 1 : 0),
    [filters, search],
  )

  const isFiltered = activeFilterCount > 0

  // ── nestjs-paginate params ────────────────────────────────────────────────

  const buildQueryParams = useCallback(
    (searchBy?: string[]): NestjsPaginateParams =>
      buildNestjsPaginateParams({ page, pageSize, sort, filters, search }, searchBy),
    [page, pageSize, sort, filters, search],
  )

  // ── Reset all ─────────────────────────────────────────────────────────────

  const resetAll = useCallback(
    () => {
      if (syncToUrl) url.resetUrl()
      else {
        setLocalPage(1)
        setLocalPageSize(resolvedDefaultPageSize)
        setLocalSort(null)
        setLocalSearch('')
        setLocalFilters({})
      }
      storage.clearAll()
      clearSelection()
      closeAllExpanded()
      setDensityState('default')
    },
    [syncToUrl, url, resolvedDefaultPageSize, storage, clearSelection, closeAllExpanded],
  )

  return {
    page, pageSize, setPage, setPageSize,
    sort, setSort, handleSortToggle,
    filters, setFilter, clearFilter, clearAllFilters,
    search, setSearch,
    columnVisibility, initColumnVisibility, toggleColumn, showAllColumns, isColumnVisible,
    selectedRows, toggleRow, toggleAll, clearSelection, isSelected, isAllSelected, isIndeterminate,
    density, setDensity,
    expandedRows, toggleExpanded, isExpanded, closeAllExpanded,
    isFiltered, activeFilterCount,
    config,
    buildQueryParams,
    resetAll,
  }
}
