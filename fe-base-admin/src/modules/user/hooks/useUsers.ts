import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortState, FilterState } from '@shared/components/ui/data-table'
import type { UpdateUserInfoDto, UserListParams } from '../types'
import { userService } from '../services/user.service'

export const USERS_QUERY_KEY = ['users']

// ── Server-side table state ───────────────────────────────────────────────────

export interface UserTableState {
  page: number
  pageSize: number
  sort: SortState | null
  search: string
  filters: FilterState
}

const DEFAULT_STATE: UserTableState = {
  page: 1,
  pageSize: 10,
  sort: null,
  search: '',
  filters: {},
}

function buildParams(state: UserTableState): UserListParams {
  const params: UserListParams = {
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

  const dateFrom = state.filters['createdAt_from']
  const dateTo = state.filters['createdAt_to']
  if (dateFrom || dateTo) {
    const parts: string[] = []
    if (dateFrom) parts.push(`$gte:${dateFrom}`)
    if (dateTo) parts.push(`$lte:${dateTo}T23:59:59.999Z`)
    params['filter.createdAt'] = parts
  }

  return params
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useUsers(state: UserTableState = DEFAULT_STATE) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, state],
    queryFn: () => userService.listUsers(buildParams(state)),
    placeholderData: keepPreviousData,
  })
}

export function useUserTableState() {
  const [state, setState] = useState<UserTableState>(DEFAULT_STATE)

  const setPage = (page: number) => setState((s) => ({ ...s, page }))
  const setPageSize = (pageSize: number) => setState((s) => ({ ...s, page: 1, pageSize }))
  const setSort = (sort: SortState | null) => setState((s) => ({ ...s, page: 1, sort }))
  const setSearch = (search: string) => setState((s) => ({ ...s, page: 1, search }))
  const setFilters = (filters: FilterState) => setState((s) => ({ ...s, page: 1, filters }))

  return { state, setPage, setPageSize, setSort, setSearch, setFilters }
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

export function useUpdateUserInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateUserInfoDto) =>
      userService.updateUserInfo(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userService.updateUserRole(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.activateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.deactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}
