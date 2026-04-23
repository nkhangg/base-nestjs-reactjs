import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortState, FilterState } from '@shared/components/ui/data-table'
import type { AdminListParams } from '../types'
import { adminService } from '../services/admin.service'

export const ADMINS_QUERY_KEY = ['admins']

// ── Server-side state ─────────────────────────────────────────────────────────

export interface AdminTableState {
  page: number
  pageSize: number
  sort: SortState | null
  search: string
  filters: FilterState
}

const DEFAULT_STATE: AdminTableState = {
  page: 1,
  pageSize: 10,
  sort: null,
  search: '',
  filters: {},
}

function buildParams(state: AdminTableState): AdminListParams {
  const params: AdminListParams = {
    page: state.page,
    limit: state.pageSize,
  }

  if (state.search) params.search = state.search

  if (state.sort) {
    params.sortBy = `${state.sort.key}:${state.sort.direction.toUpperCase()}`
  }

  if (state.filters['isActive']) {
    params['filter.isActive'] = state.filters['isActive']
  }

  if (state.filters['role']) {
    params['filter.role'] = state.filters['role']
  }

  return params
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAdmins(state: AdminTableState = DEFAULT_STATE) {
  return useQuery({
    queryKey: [...ADMINS_QUERY_KEY, state],
    queryFn: () => adminService.listAdmins(buildParams(state)),
    placeholderData: keepPreviousData,
  })
}

export function useAdminTableState() {
  const [state, setState] = useState<AdminTableState>(DEFAULT_STATE)

  const setPage = (page: number) => setState((s) => ({ ...s, page }))
  const setPageSize = (pageSize: number) => setState((s) => ({ ...s, page: 1, pageSize }))
  const setSort = (sort: SortState | null) => setState((s) => ({ ...s, page: 1, sort }))
  const setSearch = (search: string) => setState((s) => ({ ...s, page: 1, search }))
  const setFilters = (filters: FilterState) => setState((s) => ({ ...s, page: 1, filters }))

  return { state, setPage, setPageSize, setSort, setSearch, setFilters }
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createAdmin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}

export function useUpdateAdminRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminService.updateAdminRole(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}

export function useDeactivateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deactivateAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}
