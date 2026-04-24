import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FilterState, FilterValue, SortState } from '../types'

// URL format:
//   page=1 & limit=20 & sort=name:asc & q=keyword
//   filter.status=eq:active & filter.amount=btw:10,100

// ── Serialize FilterValue → URL string ────────────────────────────────────────

const OP_TO_URL: Record<string, string> = {
  eq: 'eq', neq: 'ne', contains: 'ilike',
  starts_with: 'sw', ends_with: 'ew',
  gt: 'gt', gte: 'gte', lt: 'lt', lte: 'lte', between: 'btw',
}

function serializeFilter(fv: FilterValue): string {
  const { type, value, operator } = fv
  if (value === null || value === undefined || value === '') return ''

  if (type === 'number-range' || type === 'date-range') {
    const [min, max] = value as [string | number, string | number]
    return `btw:${min},${max}`
  }

  if (type === 'multi-select' && Array.isArray(value)) {
    return `in:${(value as string[]).join(',')}`
  }

  const op = operator ? (OP_TO_URL[operator] ?? 'eq') : type === 'text' ? 'ilike' : 'eq'
  return `${op}:${String(value)}`
}

// ── Deserialize URL string → FilterValue ──────────────────────────────────────

const URL_TO_OP: Record<string, string> = {
  eq: 'eq', ne: 'neq', ilike: 'contains',
  sw: 'starts_with', ew: 'ends_with',
  gt: 'gt', gte: 'gte', lt: 'lt', lte: 'lte', btw: 'between', in: 'eq',
}

function deserializeFilter(raw: string): FilterValue | null {
  if (!raw) return null

  const colonIdx = raw.indexOf(':')
  if (colonIdx === -1) {
    return { type: 'text', value: raw, operator: 'eq' }
  }

  const opStr = raw.slice(0, colonIdx)
  const val = raw.slice(colonIdx + 1)
  const operator = (URL_TO_OP[opStr] ?? 'eq') as FilterValue['operator']

  if (opStr === 'btw') {
    const [min, max] = val.split(',')
    const numMin = Number(min)
    const numMax = Number(max)
    if (!isNaN(numMin) && !isNaN(numMax) && min !== '' && max !== '') {
      return { type: 'number-range', value: [numMin, numMax], operator: 'between' }
    }
    return { type: 'date-range', value: [min, max], operator: 'between' }
  }

  if (opStr === 'in') {
    return { type: 'multi-select', value: val.split(','), operator: 'eq' }
  }

  if (val === 'true' || val === 'false') {
    return { type: 'boolean', value: val === 'true', operator: 'eq' }
  }

  const numVal = Number(val)
  if (!isNaN(numVal) && val !== '') {
    return { type: 'number', value: numVal, operator }
  }

  return { type: 'text', value: val, operator }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UrlSyncState {
  page: number
  pageSize: number
  sort: SortState | null
  search: string
  filters: FilterState
}

export interface UrlSyncActions {
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSort: (sort: SortState | null) => void
  setSearch: (search: string) => void
  setFilter: (key: string, value: FilterValue | null) => void
  clearFilters: () => void
  resetUrl: () => void
}

// Noop instance returned when URL sync is disabled
function makeNoop(defaultPageSize: number): UrlSyncState & UrlSyncActions {
  return {
    page: 1,
    pageSize: defaultPageSize,
    sort: null,
    search: '',
    filters: {},
    setPage: () => {},
    setPageSize: () => {},
    setSort: () => {},
    setSearch: () => {},
    setFilter: () => {},
    clearFilters: () => {},
    resetUrl: () => {},
  }
}

export function useTableUrlSync(
  enabled: boolean,
  defaultPageSize: number,
): UrlSyncState & UrlSyncActions {
  // useSearchParams must be called unconditionally (rules of hooks)
  const [searchParams, setSearchParams] = useSearchParams()

  const update = useCallback(
    (updater: (p: URLSearchParams) => void) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        updater(next)
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const page = useMemo(() => Math.max(1, Number(searchParams.get('page') ?? 1)), [searchParams])
  const pageSize = useMemo(
    () => Math.max(1, Number(searchParams.get('limit') ?? defaultPageSize)),
    [searchParams, defaultPageSize],
  )
  const search = useMemo(() => searchParams.get('q') ?? '', [searchParams])

  const sort = useMemo((): SortState | null => {
    const raw = searchParams.get('sort')
    if (!raw) return null
    const [key, dir] = raw.split(':')
    if (!key) return null
    return { key, direction: dir === 'desc' ? 'desc' : 'asc' }
  }, [searchParams])

  const filters = useMemo((): FilterState => {
    const result: FilterState = {}
    for (const [param, val] of searchParams.entries()) {
      if (param.startsWith('filter.')) {
        const fieldKey = param.slice(7)
        const parsed = deserializeFilter(val)
        if (parsed) result[fieldKey] = parsed
      }
    }
    return result
  }, [searchParams])

  const setPage = useCallback(
    (p: number) => update(params => params.set('page', String(p))),
    [update],
  )

  const setPageSize = useCallback(
    (size: number) => update(params => {
      params.set('limit', String(size))
      params.set('page', '1')
    }),
    [update],
  )

  const setSort = useCallback(
    (s: SortState | null) => update(params => {
      if (s) params.set('sort', `${s.key}:${s.direction}`)
      else params.delete('sort')
    }),
    [update],
  )

  const setSearch = useCallback(
    (q: string) => update(params => {
      if (q) params.set('q', q)
      else params.delete('q')
      params.set('page', '1')
    }),
    [update],
  )

  const setFilter = useCallback(
    (key: string, value: FilterValue | null) => update(params => {
      if (value) {
        const serialized = serializeFilter(value)
        if (serialized) params.set(`filter.${key}`, serialized)
        else params.delete(`filter.${key}`)
      } else {
        params.delete(`filter.${key}`)
      }
      params.set('page', '1')
    }),
    [update],
  )

  const clearFilters = useCallback(
    () => update(params => {
      for (const key of [...params.keys()]) {
        if (key.startsWith('filter.') || key === 'q') params.delete(key)
      }
      params.set('page', '1')
    }),
    [update],
  )

  const resetUrl = useCallback(
    () => setSearchParams({}, { replace: true }),
    [setSearchParams],
  )

  if (!enabled) return makeNoop(defaultPageSize)

  return { page, pageSize, sort, search, filters, setPage, setPageSize, setSort, setSearch, setFilter, clearFilters, resetUrl }
}
