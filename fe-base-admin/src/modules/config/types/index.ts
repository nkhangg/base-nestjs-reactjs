export type ConfigScope = 'public' | 'members' | 'internal'

export interface AppConfig {
  id: string
  key: string
  value: unknown
  description: string | null
  isEnabled: boolean
  scope: ConfigScope
  tags: string[]
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateConfigDto {
  key: string
  value: unknown
  description?: string
  scope?: ConfigScope
  tags?: string[]
}

export interface UpdateConfigDto {
  value?: unknown
  description?: string | null
  scope?: ConfigScope
  tags?: string[]
}

export interface ConfigListParams {
  page?: number
  limit?: number
  sortBy?: string
  search?: string
  'filter.scope'?: string
  'filter.isEnabled'?: string
}

export interface ConfigListMeta {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

export interface ConfigListResponse {
  data: AppConfig[]
  meta: ConfigListMeta
}
