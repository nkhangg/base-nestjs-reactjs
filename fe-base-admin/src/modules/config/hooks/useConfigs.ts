import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortState, FilterState } from '@shared/components/ui/data-table'
import type { ConfigListParams, UpdateConfigDto, CreateConfigDto } from '../types'
import { configService } from '../services/config.service'

export const CONFIGS_QUERY_KEY = ['configs']

// ── Server-side table state ───────────────────────────────────────────────────

export interface ConfigTableState {
  page: number
  pageSize: number
  sort: SortState | null
  search: string
  filters: FilterState
}

const DEFAULT_STATE: ConfigTableState = {
  page: 1,
  pageSize: 20,
  sort: null,
  search: '',
  filters: {},
}

function buildParams(state: ConfigTableState): ConfigListParams {
  const params: ConfigListParams = { page: state.page, limit: state.pageSize }
  if (state.search) params.search = state.search
  if (state.sort) params.sortBy = `${state.sort.key}:${state.sort.direction.toUpperCase()}`
  if (state.filters['scope']) params['filter.scope'] = state.filters['scope']
  if (state.filters['isEnabled']) params['filter.isEnabled'] = state.filters['isEnabled']
  return params
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useConfigs(state: ConfigTableState = DEFAULT_STATE) {
  return useQuery({
    queryKey: [...CONFIGS_QUERY_KEY, state],
    queryFn: () => configService.listConfigs(buildParams(state)),
    placeholderData: keepPreviousData,
  })
}

export function useConfig(id: string | null) {
  return useQuery({
    queryKey: [...CONFIGS_QUERY_KEY, id],
    queryFn: () => configService.getConfig(id!),
    enabled: !!id,
  })
}

export function useConfigTableState() {
  const [state, setState] = useState<ConfigTableState>(DEFAULT_STATE)
  const setPage = (page: number) => setState((s) => ({ ...s, page }))
  const setPageSize = (pageSize: number) => setState((s) => ({ ...s, page: 1, pageSize }))
  const setSort = (sort: SortState | null) => setState((s) => ({ ...s, page: 1, sort }))
  const setSearch = (search: string) => setState((s) => ({ ...s, page: 1, search }))
  const setFilters = (filters: FilterState) => setState((s) => ({ ...s, page: 1, filters }))
  return { state, setPage, setPageSize, setSort, setSearch, setFilters }
}

export function useCreateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateConfigDto) => configService.createConfig(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateConfigDto) =>
      configService.updateConfig(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}

export function useToggleConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => configService.toggleConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}

export function useDeleteConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => configService.deleteConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}
