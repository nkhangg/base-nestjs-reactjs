import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { adminService } from '../services/admin.service'

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
