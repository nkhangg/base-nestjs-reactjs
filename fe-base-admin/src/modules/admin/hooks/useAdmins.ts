import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { adminService } from '../services/admin.service'
import type { UpdateAdminInfoDto, ResetAdminPasswordDto } from '../types'

export const ADMINS_QUERY_KEY = ['admins']

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAdmins(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...ADMINS_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => adminService.listAdmins(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createAdmin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}

export function useAdminRoles(adminId: string) {
  return useQuery({
    queryKey: [...ADMINS_QUERY_KEY, adminId, 'roles'],
    queryFn: () => adminService.getAdminRoles(adminId),
    enabled: !!adminId,
  })
}

export function useSyncAdminRoles(adminId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roles: string[]) => adminService.syncAdminRoles(adminId, { roles }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY })
    },
  })
}

export function useDeactivateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deactivateAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}

export function useActivateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.activateAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}

export function useUpdateAdminInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAdminInfoDto }) =>
      adminService.updateAdminInfo(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMINS_QUERY_KEY }),
  })
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ResetAdminPasswordDto }) =>
      adminService.resetAdminPassword(id, dto),
  })
}
