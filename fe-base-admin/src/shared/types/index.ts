// ── API Response wrappers ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ── Utility types ──────────────────────────────────────────────────────────
export type ID = string | number

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type SelectOption<T = string> = {
  label: string
  value: T
  disabled?: boolean
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

// ── Base entity ────────────────────────────────────────────────────────────
export interface BaseEntity {
  id: ID
  createdAt: string
  updatedAt: string
}
