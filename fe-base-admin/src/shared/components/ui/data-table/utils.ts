import type {
  FilterValue,
  FilterOperator,
  FilterState,
  SortState,
  TableDensity,
  NestjsPaginateParams,
} from './types'

// ── Value accessor ────────────────────────────────────────────────────────────

export function getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k]
    }
    return undefined
  }, obj)
}

// ── Comparison ────────────────────────────────────────────────────────────────

export function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

// ── Pagination ────────────────────────────────────────────────────────────────

export function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

// ── Density class map ─────────────────────────────────────────────────────────

export const DENSITY_CELL_CLASSES: Record<TableDensity, string> = {
  compact: 'px-3 py-1.5 text-xs',
  default: 'px-4 py-3 text-sm',
  comfortable: 'px-4 py-4 text-sm',
}

export const DENSITY_HEADER_CLASSES: Record<TableDensity, string> = {
  compact: 'px-3 py-2 text-xs',
  default: 'px-4 py-3 text-xs',
  comfortable: 'px-4 py-4 text-xs',
}

// ── nestjs-paginate operator map ──────────────────────────────────────────────

const OPERATOR_TO_NESTJS: Record<FilterOperator, string> = {
  eq: '$eq',
  neq: '$ne',
  contains: '$ilike',
  starts_with: '$sw',
  ends_with: '$ew',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
  between: '$btw',
}

function buildNestjsFilterParam(filterValue: FilterValue): string {
  const { type, value, operator } = filterValue
  if (value === null || value === undefined) return ''

  switch (type) {
    case 'boolean':
    case 'select':
      return `$eq:${String(value)}`

    case 'multi-select': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      if (arr.length === 0) return ''
      return `$in:${arr.join(',')}`
    }

    case 'number-range':
    case 'date-range': {
      if (!Array.isArray(value)) return ''
      const [min, max] = value as [string | number, string | number]
      return `$btw:${min},${max}`
    }

    case 'text': {
      const op = operator ? OPERATOR_TO_NESTJS[operator] : '$ilike'
      const v = String(value)
      // wrap with % only for ilike
      return op === '$ilike' ? `${op}:%${v}%` : `${op}:${v}`
    }

    case 'datetime':
    case 'date':
    case 'number': {
      const op = operator ? OPERATOR_TO_NESTJS[operator] : '$eq'
      return `${op}:${String(value)}`
    }

    default:
      return `$eq:${String(value)}`
  }
}

// ── nestjs-paginate params builder ────────────────────────────────────────────

export function buildNestjsPaginateParams(
  state: Pick<TableState, 'page' | 'pageSize' | 'sort' | 'filters' | 'search'>,
  searchBy?: string[],
): NestjsPaginateParams {
  const params: NestjsPaginateParams = {
    page: state.page,
    limit: state.pageSize,
  }

  if (state.sort) {
    params.sortBy = `${state.sort.key}:${state.sort.direction.toUpperCase()}`
  }

  if (state.search) {
    params.search = state.search
    if (searchBy?.length) params.searchBy = searchBy
  }

  for (const [key, filterValue] of Object.entries(state.filters)) {
    const param = buildNestjsFilterParam(filterValue)
    if (param) {
      params[`filter.${key}`] = param
    }
  }

  return params
}

// Partial state type used by buildNestjsPaginateParams
interface TableState {
  page: number
  pageSize: number
  sort: SortState | null
  filters: FilterState
  search: string
}

// ── Client-side filter matching ───────────────────────────────────────────────

export function matchesFilter(rowValue: unknown, filterValue: FilterValue): boolean {
  const { type, value, operator } = filterValue
  if (value === null || value === undefined || value === '') return true

  switch (type) {
    case 'text': {
      const raw = String(rowValue ?? '').toLowerCase()
      const query = String(value).toLowerCase()
      if (!operator || operator === 'contains') return raw.includes(query)
      if (operator === 'eq') return raw === query
      if (operator === 'starts_with') return raw.startsWith(query)
      if (operator === 'ends_with') return raw.endsWith(query)
      return raw.includes(query)
    }

    case 'boolean':
    case 'select':
      return String(rowValue) === String(value)

    case 'multi-select': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      if (arr.length === 0) return true
      return arr.includes(String(rowValue))
    }

    case 'number': {
      const num = Number(rowValue)
      const val = Number(value)
      if (isNaN(num)) return false
      if (!operator || operator === 'eq') return num === val
      if (operator === 'gt') return num > val
      if (operator === 'gte') return num >= val
      if (operator === 'lt') return num < val
      if (operator === 'lte') return num <= val
      return num === val
    }

    case 'number-range': {
      if (!Array.isArray(value)) return true
      const num = Number(rowValue)
      const [min, max] = value as [number, number]
      return num >= min && num <= max
    }

    case 'date':
    case 'datetime': {
      const rowDate = String(rowValue ?? '').slice(0, 10)
      const filterDate = String(value).slice(0, 10)
      if (!operator || operator === 'eq') return rowDate === filterDate
      if (operator === 'gt') return rowDate > filterDate
      if (operator === 'gte') return rowDate >= filterDate
      if (operator === 'lt') return rowDate < filterDate
      if (operator === 'lte') return rowDate <= filterDate
      return rowDate === filterDate
    }

    case 'date-range': {
      if (!Array.isArray(value)) return true
      const rowDate = String(rowValue ?? '').slice(0, 10)
      const [from, to] = value as [string, string]
      return rowDate >= from && rowDate <= to
    }

    default:
      return true
  }
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportToCsv(
  data: Record<string, unknown>[],
  headers: { key: string; label: string }[],
  filename: string,
): void {
  const headerRow = headers.map(h => `"${h.label}"`).join(',')
  const rows = data.map(row =>
    headers
      .map(h => {
        const val = getNestedValue(row, h.key)
        const str = val === null || val === undefined ? '' : String(val)
        return `"${str.replace(/"/g, '""')}"`
      })
      .join(','),
  )

  const csv = '﻿' + [headerRow, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
