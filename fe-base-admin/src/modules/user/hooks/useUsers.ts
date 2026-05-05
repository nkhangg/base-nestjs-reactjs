import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type { UpdateUserInfoDto } from '../types'
import { userService } from '../services/user.service'

export const USERS_QUERY_KEY = ['users']

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useUsers(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => userService.listUsers(params),
    placeholderData: keepPreviousData,
  })
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
