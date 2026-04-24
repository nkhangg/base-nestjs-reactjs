import { useState, useMemo, useCallback, useEffect, useRef, type ChangeEvent } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  SlidersHorizontal,
  X,
  Inbox,
  CalendarIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@shared/utils'
import { useDebounce } from '@shared/hooks'
import { Input } from './input'
import { Button } from './button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export type FilterState = Record<string, string>

export interface ColumnDef<T extends Record<string, unknown>> {
  /** Supports dot-notation for nested values, e.g. "user.email" */
  key: string
  header: string
  sortable?: boolean
  filterable?: boolean
  /** Defaults to "select" when filterOptions provided, otherwise "text" */
  filterType?: 'text' | 'select' | 'date-range'
  filterOptions?: { label: string; value: string }[]
  width?: string
  className?: string
  headerClassName?: string
  render?: (value: unknown, row: T, index: number) => ReactNode
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean

  // ── Search ──
  searchable?: boolean
  searchPlaceholder?: string
  /** Keys to search against (client-side). Defaults to all column keys. */
  searchKeys?: string[]

  // ── Pagination ──
  defaultPageSize?: number
  pageSizeOptions?: number[]

  // ── Server-side mode ──
  // Provide `total` to switch to server-side mode. All filtering/sorting/paging
  // is delegated to the caller via the callbacks below.
  total?: number
  page?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSort?: (sort: SortState | null) => void
  onSearch?: (value: string) => void
  onFilter?: (filters: FilterState) => void

  // ── Row ──
  emptyText?: string
  className?: string
  /** Unique key per row. String = field path, function = custom resolver. */
  rowKey?: string | ((row: T) => string | number)
  onRowClick?: (row: T) => void
  rowClassName?: (row: T, index: number) => string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sentinel value used in filter Select to represent "no filter / All"
const ALL_VALUE = '__all__'

function getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k]
    }
    return undefined
  }, obj)
}

function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

// ─── Date range filter ────────────────────────────────────────────────────────

function DateRangeFilter({
  fromValue,
  toValue,
  onFrom,
  onTo,
}: {
  fromValue: string
  toValue: string
  onFrom: (v: string) => void
  onTo: (v: string) => void
}) {
  const parseDate = (s: string) => (s ? new Date(s + 'T00:00:00') : undefined)
  const fromDate = parseDate(fromValue)
  const toDate = parseDate(toValue)

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex h-7 items-center gap-1.5 rounded border px-2 text-xs transition-colors hover:bg-gray-50',
              fromValue ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-400',
            )}
          >
            <CalendarIcon className="h-3 w-3 shrink-0" />
            <span>{fromDate ? format(fromDate, 'dd/MM/yy') : 'Từ'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={(d) => onFrom(d ? format(d, 'yyyy-MM-dd') : '')}
            disabled={(d) => (toDate ? d > toDate : false)}
          />
        </PopoverContent>
      </Popover>

      <span className="text-[10px] text-gray-300">→</span>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex h-7 items-center gap-1.5 rounded border px-2 text-xs transition-colors hover:bg-gray-50',
              toValue ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-400',
            )}
          >
            <CalendarIcon className="h-3 w-3 shrink-0" />
            <span>{toDate ? format(toDate, 'dd/MM/yy') : 'Đến'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={(d) => onTo(d ? format(d, 'yyyy-MM-dd') : '')}
            disabled={(d) => (fromDate ? d < fromDate : false)}
          />
        </PopoverContent>
      </Popover>

      {(fromValue || toValue) && (
        <button
          onClick={() => { onFrom(''); onTo('') }}
          className="rounded p-0.5 text-gray-300 hover:text-gray-600 transition-colors"
          title="Xóa bộ lọc ngày"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKeys,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  total: controlledTotal,
  page: controlledPage,
  onPageChange,
  onPageSizeChange,
  onSort: onSortProp,
  onSearch: onSearchProp,
  onFilter: onFilterProp,
  emptyText = 'No data available',
  className,
  rowKey,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const isServerSide = controlledTotal !== undefined

  // ── State ──
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<SortState | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [internalPage, setInternalPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const debouncedSearch = useDebounce(searchInput, 300)

  // Stable refs so effects never capture stale callbacks
  const onSearchRef = useRef(onSearchProp)
  const onFilterRef = useRef(onFilterProp)
  const onSortRef = useRef(onSortProp)
  onSearchRef.current = onSearchProp
  onFilterRef.current = onFilterProp
  onSortRef.current = onSortProp

  const currentPage = isServerSide ? (controlledPage ?? 1) : internalPage

  // Server-side: propagate debounced search to parent
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (isServerSide) onSearchRef.current?.(debouncedSearch)
  }, [debouncedSearch, isServerSide])

  // ── Handlers ──
  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value)
      if (!isServerSide) setInternalPage(1)
    },
    [isServerSide],
  )

  const handleSort = useCallback(
    (key: string) => {
      setSort(prev => {
        let next: SortState | null
        if (prev?.key === key) {
          next = prev.direction === 'asc' ? { key, direction: 'desc' } : null
        } else {
          next = { key, direction: 'asc' }
        }
        if (isServerSide) onSortRef.current?.(next)
        return next
      })
      if (!isServerSide) setInternalPage(1)
    },
    [isServerSide],
  )

  const handleFilter = useCallback(
    (key: string, value: string) => {
      setFilters(prev => {
        const next = value
          ? { ...prev, [key]: value }
          : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
        if (isServerSide) onFilterRef.current?.(next)
        return next
      })
      if (!isServerSide) setInternalPage(1)
    },
    [isServerSide],
  )

  const clearAll = useCallback(() => {
    setFilters({})
    setSearchInput('')
    if (!isServerSide) setInternalPage(1)
    if (isServerSide) {
      onFilterRef.current?.({})
      onSearchRef.current?.('')
    }
  }, [isServerSide])

  const handlePageChange = useCallback(
    (page: number) => {
      if (isServerSide) onPageChange?.(page)
      else setInternalPage(page)
    },
    [isServerSide, onPageChange],
  )

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const size = Number(value)
      setPageSize(size)
      setInternalPage(1)
      if (isServerSide) {
        onPageSizeChange?.(size)
        onPageChange?.(1)
      }
    },
    [isServerSide, onPageSizeChange, onPageChange],
  )

  // ── Client-side data processing (memoized pipeline) ──
  const processedData = useMemo(() => {
    if (isServerSide) return data

    let result = data

    // 1. Global search
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      const keys = searchKeys ?? columns.map(c => c.key)
      result = result.filter(row =>
        keys.some(key => String(getNestedValue(row, key) ?? '').toLowerCase().includes(query)),
      )
    }

    // 2. Column filters
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        result = result.filter(row => String(getNestedValue(row, key) ?? '') === value)
      }
    }

    // 3. Sort
    if (sort) {
      const { key, direction } = sort
      result = [...result].sort((a, b) => {
        const cmp = compareValues(getNestedValue(a, key), getNestedValue(b, key))
        return direction === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [isServerSide, data, debouncedSearch, searchKeys, columns, filters, sort])

  // ── Derived values ──
  const totalCount = isServerSide ? (controlledTotal ?? 0) : processedData.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const pageData = useMemo(() => {
    if (isServerSide) return processedData
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [isServerSide, processedData, currentPage, pageSize])

  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const getRowKey = useCallback(
    (row: T, index: number): string => {
      if (!rowKey) return String(index)
      if (typeof rowKey === 'function') return String(rowKey(row))
      return String(getNestedValue(row, rowKey) ?? index)
    },
    [rowKey],
  )

  const hasFilterableColumns = columns.some(c => c.filterable)
  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (searchInput ? 1 : 0)
  const isFiltered = activeFilterCount > 0

  const showFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showTo = Math.min(currentPage * pageSize, totalCount)

  // ── Render ──
  return (
    <div className={cn('flex flex-col gap-3', className)}>

      {/* ── Toolbar ── */}
      {(searchable || hasFilterableColumns) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchInput}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="pl-8 h-8"
              />
            </div>
          )}

          {hasFilterableColumns && (
            <Button
              variant={showFilters ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowFilters(v => !v)}
              className="gap-1.5 shrink-0"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-gray-500">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">

              {/* Column header row */}
              <tr className="border-b border-gray-200">
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap',
                      col.sortable && 'cursor-pointer select-none hover:bg-gray-100 transition-colors',
                      col.headerClassName,
                    )}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span
                          className={cn(
                            'shrink-0 transition-colors',
                            sort?.key === col.key ? 'text-gray-900' : 'text-gray-300',
                          )}
                        >
                          {sort?.key === col.key ? (
                            sort.direction === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Filter row */}
              {showFilters && hasFilterableColumns && (
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  {columns.map(col => (
                    <th key={col.key} className="px-3 py-2 font-normal">
                      {col.filterable && (
                        col.filterType === 'date-range' ? (
                          <DateRangeFilter
                            fromValue={filters[`${col.key}_from`] ?? ''}
                            toValue={filters[`${col.key}_to`] ?? ''}
                            onFrom={(v) => handleFilter(`${col.key}_from`, v)}
                            onTo={(v) => handleFilter(`${col.key}_to`, v)}
                          />
                        ) : col.filterType === 'select' || col.filterOptions ? (
                          <Select
                            value={filters[col.key] || ALL_VALUE}
                            onValueChange={v => handleFilter(col.key, v === ALL_VALUE ? '' : v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ALL_VALUE}>All</SelectItem>
                              {col.filterOptions?.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={filters[col.key] ?? ''}
                            onChange={e => handleFilter(col.key, e.target.value)}
                            placeholder="Filter..."
                            className="h-7 text-xs"
                          />
                        )
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div
                          className="h-4 animate-pulse rounded-md bg-gray-100"
                          style={{ width: `${60 + ((i * 13 + col.key.length * 7) % 35)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                      <Inbox className="h-10 w-10 opacity-30" />
                      <span className="text-sm">
                        {isFiltered ? 'No results match your filters' : emptyText}
                      </span>
                      {isFiltered && (
                        <button
                          onClick={clearAll}
                          className="text-xs text-gray-900 underline underline-offset-2 hover:opacity-70"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((row, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index
                  return (
                    <tr
                      key={getRowKey(row, globalIndex)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-gray-50/80',
                        rowClassName?.(row, globalIndex),
                      )}
                    >
                      {columns.map(col => {
                        const value = getNestedValue(row, col.key)
                        return (
                          <td
                            key={col.key}
                            className={cn('px-4 py-3 text-gray-700', col.className)}
                          >
                            {col.render ? col.render(value, row, globalIndex) : String(value ?? '')}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && totalCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">

            {/* Count */}
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Showing{' '}
              <span className="font-medium text-gray-700">{showFrom}–{showTo}</span>
              {' '}of{' '}
              <span className="font-medium text-gray-700">{totalCount}</span>
            </span>

            {/* Pages */}
            <div className="flex items-center gap-1">
              <PaginationButton
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </PaginationButton>

              <PaginationButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </PaginationButton>

              {pageNumbers.map((num, i) =>
                num === '...' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="flex h-8 w-6 items-center justify-center text-xs text-gray-400 select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={num}
                    onClick={() => handlePageChange(num as number)}
                    className={cn(
                      'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors',
                      num === currentPage
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    {num}
                  </button>
                ),
              )}

              <PaginationButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </PaginationButton>

              <PaginationButton
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </PaginationButton>
            </div>

            {/* Page size */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Rows per page</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[4.5rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(size => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaginationButton({
  children,
  disabled,
  onClick,
  ...props
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  'aria-label'?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors',
        'hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30',
      )}
      {...props}
    >
      {children}
    </button>
  )
}
