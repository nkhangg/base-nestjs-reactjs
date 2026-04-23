import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/admin.service'
import type { CreateRoleDto, SubjectType, UpdateRoleDto } from '../types'

export const ROLES_QUERY_KEY = ['roles']
export const ROLE_RESOURCES_QUERY_KEY = ['role-resources']

export function useRoles(subjectType?: SubjectType) {
  return useQuery({
    queryKey: [...ROLES_QUERY_KEY, subjectType],
    queryFn: () => adminService.listRoles(subjectType ? { subjectType } : undefined),
  })
}

export function useRole(id: string) {
  return useQuery({
    queryKey: [...ROLES_QUERY_KEY, id],
    queryFn: () => adminService.getRole(id),
    enabled: !!id,
  })
}

export function useRoleResources() {
  return useQuery({
    queryKey: ROLE_RESOURCES_QUERY_KEY,
    queryFn: () => adminService.listRoleResources(),
    staleTime: 30_000,
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRoleDto) => adminService.createRole(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ROLE_RESOURCES_QUERY_KEY })
    },
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRoleDto }) =>
      adminService.updateRole(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ROLE_RESOURCES_QUERY_KEY })
    },
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ROLE_RESOURCES_QUERY_KEY })
    },
  })
}
