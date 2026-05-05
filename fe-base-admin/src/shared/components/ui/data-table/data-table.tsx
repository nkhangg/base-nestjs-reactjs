import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Inbox } from 'lucide-react'
import { cn } from '@shared/utils'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Skeleton } from '@shared/components/ui/skeleton'
import { DataTableToolbar } from './data-table-toolbar'
import { DataTableFilterRow } from './data-table-filter-row'
import { DataTablePagination } from './data-table-pagination'
import { useDataTable } from './hooks/use-data-table'
import type { UseDataTableReturn } from './hooks/use-data-table'
import {
  getNestedValue,
  matchesFilter,
  compareValues,
  DENSITY_CELL_CLASSES,
  DENSITY_HEADER_CLASSES,
} from './utils'
import type { DataTableProps, FilterPreset, SortState } from './types'

// ── Extended Props ────────────────────────────────────────────────────────────

interface DataTableFullProps<T extends Record<string, unknown>> extends DataTableProps<T> {
  table?: UseDataTableReturn<T>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  config: configProp,
  table: controlledTable,
  total: externalTotal,
  emptyText = 'No results found.',
  className,
  rowKey,
  onRowClick,
  rowClassName,
  onRefresh,
}: DataTableFullProps<T>) {
  const internalTable = useDataTable<T>(controlledTable ? {} : (configProp ?? {}))
  const table = controlledTable ?? internalTable
  const config = table.config ?? configProp ?? {}

  const [showFilterRow, setShowFilterRow] = useState(false)
  const isServerSide = externalTotal !== undefined

  // Init column visibility once on mount
  const initCalledRef = useRef(false)
  useEffect(() => {
    if (!initCalledRef.current) {
      table.initColumnVisibility(columns)
      initCalledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Client-side data pipeline ─────────────────────────────────────────────

  const processedData = useMemo<T[]>(() => {
    if (isServerSide) return data

    let result = [...data]

    if (table.search) {
      const searchKeys = (config.searchKeys ?? columns.map((c) => c.key)) as string[]
      const q = table.search.toLowerCase()
      result = result.filter((row) =>
        searchKeys.some((key) =>
          String(getNestedValue(row, key) ?? '')
            .toLowerCase()
            .includes(q),
        ),
      )
    }

    if (Object.keys(table.filters).length > 0) {
      result = result.filter((row) =>
        Object.entries(table.filters).every(([key, filterValue]) =>
          matchesFilter(getNestedValue(row, key), filterValue),
        ),
      )
    }

    if (table.sort) {
      const { key, direction } = table.sort
      result = [...result].sort((a, b) => {
        const cmp = compareValues(getNestedValue(a, key), getNestedValue(b, key))
        return direction === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, table.search, table.filters, table.sort, isServerSide, config.searchKeys, columns])

  const total = isServerSide ? (externalTotal ?? 0) : processedData.length

  const pageData = useMemo<T[]>(() => {
    if (isServerSide) return data
    const start = (table.page - 1) * table.pageSize
    return processedData.slice(start, start + table.pageSize)
  }, [isServerSide, data, processedData, table.page, table.pageSize])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getRowId(row: T, index: number): string | number {
    if (typeof rowKey === 'function') return rowKey(row)
    if (typeof rowKey === 'string') {
      const v = getNestedValue(row, rowKey) as string | number | undefined
      return v ?? index
    }
    return index
  }

  const pageIds = useMemo(
    () => pageData.map((row, i) => getRowId(row, i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageData],
  )

  const visibleColumns = columns.filter((col) => table.isColumnVisible(col.key))

  // colspan = selection col + expand col + data cols
  const prefixCount = (config.expandable ? 1 : 0) + (config.selectable ? 1 : 0)
  const colCount = prefixCount + visibleColumns.length

  function handleApplyPreset(preset: FilterPreset) {
    Object.entries(preset.filters).forEach(([key, value]) => {
      table.setFilter(key, value)
    })
    if (preset.search !== undefined) table.setSearch(preset.search)
    table.setPage(1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toolbar */}
      <DataTableToolbar
        config={config}
        data={data}
        columns={columns}
        search={table.search}
        onSearch={table.setSearch}
        showFilterRow={showFilterRow}
        onToggleFilterRow={() => setShowFilterRow((v) => !v)}
        activeFilterCount={table.activeFilterCount}
        isFiltered={table.isFiltered}
        onClearAll={() => {
          table.clearAllFilters()
          setShowFilterRow(false)
        }}
        filters={table.filters}
        columnVisibility={table.columnVisibility}
        onToggleColumn={table.toggleColumn}
        onShowAllColumns={table.showAllColumns}
        density={table.density}
        onSetDensity={table.setDensity}
        selectedCount={table.selectedRows.size}
        selectedRows={pageData.filter((_, i) => table.isSelected(pageIds[i]))}
        onClearSelection={table.clearSelection}
        onApplyPreset={handleApplyPreset}
        onRefresh={onRefresh}
        loading={loading}
      />

      {/* Table wrapper */}
      <div className="relative overflow-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {/* Expand column */}
              {config.expandable && (
                <th className={cn(DENSITY_HEADER_CLASSES[table.density], 'w-8')} />
              )}

              {/* Select-all checkbox */}
              {config.selectable && (
                <th className={cn(DENSITY_HEADER_CLASSES[table.density], 'w-10')}>
                  <Checkbox
                    checked={
                      table.isIndeterminate(pageIds)
                        ? 'indeterminate'
                        : table.isAllSelected(pageIds)
                    }
                    onCheckedChange={() => table.toggleAll(pageIds)}
                    aria-label="Select all"
                  />
                </th>
              )}

              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    DENSITY_HEADER_CLASSES[table.density],
                    'whitespace-nowrap text-left font-semibold uppercase tracking-wide text-muted-foreground',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    col.headerClassName,
                    col.sticky === 'left' && 'sticky left-0 z-10 bg-muted/50',
                    col.sticky === 'right' && 'sticky right-0 z-10 bg-muted/50',
                  )}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  onClick={col.sortable ? () => table.handleSortToggle(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon sortKey={col.key} currentSort={table.sort} />}
                  </span>
                </th>
              ))}
            </tr>

            {/* Filter row */}
            {showFilterRow && (
              <DataTableFilterRow
                columns={columns}
                filters={table.filters}
                onFilter={table.setFilter}
                columnVisibility={table.columnVisibility}
                prefixCells={prefixCount}
              />
            )}
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: Math.min(table.pageSize, 5) }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {config.expandable && <td className={DENSITY_CELL_CLASSES[table.density]} />}
                  {config.selectable && <td className={DENSITY_CELL_CLASSES[table.density]} />}
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={DENSITY_CELL_CLASSES[table.density]}>
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-16 text-center text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-10 w-10 opacity-30" />
                  <p className="text-sm">{emptyText}</p>
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => {
                const id = getRowId(row, rowIndex)
                const selected = table.isSelected(id)
                const expanded = config.expandable ? table.isExpanded(id) : false
                const extraClass = rowClassName?.(row, rowIndex) ?? ''

                return (
                  <Fragment key={id}>
                    <tr
                      className={cn(
                        'border-b border-border transition-colors last:border-b-0',
                        selected ? 'bg-primary/5' : 'hover:bg-muted/40',
                        onRowClick && 'cursor-pointer',
                        extraClass,
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {/* Expand toggle */}
                      {config.expandable && (
                        <td
                          className={cn(DENSITY_CELL_CLASSES[table.density], 'w-8 cursor-pointer')}
                          onClick={(e) => {
                            e.stopPropagation()
                            table.toggleExpanded(id)
                          }}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                      )}

                      {/* Selection checkbox */}
                      {config.selectable && (
                        <td
                          className={cn(DENSITY_CELL_CLASSES[table.density], 'w-10')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => table.toggleRow(id)}
                            aria-label={`Select row ${id}`}
                          />
                        </td>
                      )}

                      {/* Data cells */}
                      {visibleColumns.map((col) => {
                        const rawValue = getNestedValue(row, col.key)
                        const content = col.render
                          ? col.render(rawValue, row, rowIndex)
                          : rawValue !== null && rawValue !== undefined
                            ? String(rawValue)
                            : '—'

                        return (
                          <td
                            key={col.key}
                            className={cn(
                              DENSITY_CELL_CLASSES[table.density],
                              col.className,
                              col.sticky === 'left' && 'sticky left-0 z-10 bg-background',
                              col.sticky === 'right' && 'sticky right-0 z-10 bg-background',
                            )}
                            style={{ width: col.width, minWidth: col.minWidth }}
                          >
                            {content as React.ReactNode}
                          </td>
                        )
                      })}
                    </tr>

                    {/* Expansion panel */}
                    {expanded && config.expandable && (
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={colCount} className="px-4 py-3">
                          {config.expandable(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {config.showPagination !== false && (
        <DataTablePagination
          page={table.page}
          pageSize={table.pageSize}
          total={total}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          pageSizeOptions={config.pageSizeOptions}
          loading={loading}
        />
      )}
    </div>
  )
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ sortKey, currentSort }: { sortKey: string; currentSort: SortState | null }) {
  if (!currentSort || currentSort.key !== sortKey) {
    return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
  }
  return currentSort.direction === 'asc' ? (
    <ChevronUp className="h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5" />
  )
}
