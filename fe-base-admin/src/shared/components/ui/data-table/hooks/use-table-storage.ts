import { useLocalStorage } from '@shared/hooks'
import type { FilterState, SortState, TableDensity } from '../types'

interface StorageConfig {
  tableId: string
  persistColumnVisibility?: boolean
  persistPageSize?: boolean
  persistFilters?: boolean
  persistSort?: boolean
  persistDensity?: boolean
}

// key pattern: dt_<tableId>_<field>  →  e.g. dt_admin-list_pageSize
function storageKey(tableId: string, field: string): string {
  return `dt_${tableId}_${field}`
}

export function useTableStorage(config: StorageConfig) {
  const { tableId } = config

  const [storedCols, saveCols, removeCols] = useLocalStorage<Record<string, boolean>>(
    storageKey(tableId, 'cols'),
    {},
  )

  const [storedPageSize, savePageSize, removePageSize] = useLocalStorage<number>(
    storageKey(tableId, 'pageSize'),
    0, // 0 = "not set" — caller falls back to APP_CONFIG default
  )

  const [storedFilters, saveFilters, removeFilters] = useLocalStorage<FilterState>(
    storageKey(tableId, 'filters'),
    {},
  )

  const [storedSort, saveSort, removeSort] = useLocalStorage<SortState | null>(
    storageKey(tableId, 'sort'),
    null,
  )

  const [storedDensity, saveDensity, removeDensity] = useLocalStorage<TableDensity>(
    storageKey(tableId, 'density'),
    'default',
  )

  function clearAll() {
    if (config.persistColumnVisibility) removeCols()
    if (config.persistPageSize) removePageSize()
    if (config.persistFilters) removeFilters()
    if (config.persistSort) removeSort()
    if (config.persistDensity) removeDensity()
  }

  return {
    columnVisibility: config.persistColumnVisibility ? storedCols : undefined,
    saveColumnVisibility: config.persistColumnVisibility ? saveCols : undefined,

    pageSize: config.persistPageSize && storedPageSize > 0 ? storedPageSize : undefined,
    savePageSize: config.persistPageSize ? savePageSize : undefined,

    filters: config.persistFilters ? storedFilters : undefined,
    saveFilters: config.persistFilters ? saveFilters : undefined,

    sort: config.persistSort ? storedSort : undefined,
    saveSort: config.persistSort ? saveSort : undefined,

    density: config.persistDensity ? storedDensity : undefined,
    saveDensity: config.persistDensity ? saveDensity : undefined,

    clearAll,
  } as const
}

export type TableStorageReturn = ReturnType<typeof useTableStorage>
