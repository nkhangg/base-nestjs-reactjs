import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { organizationService } from '../services/organization.service'
import { QUERY_KEYS } from '@shared/constants'

const ORG_KEYS = QUERY_KEYS.ORGANIZATION

// ── Organizations ──────────────────────────────────────────────────────────────

export function useOrgList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...ORG_KEYS.LIST, JSON.stringify(params)],
    queryFn: () => organizationService.listOrgs(params),
    placeholderData: keepPreviousData,
  })
}

export function useOrg(id: string | undefined) {
  return useQuery({
    queryKey: [...ORG_KEYS.DETAIL, id],
    queryFn: () => organizationService.getOrg(id!),
    enabled: !!id,
  })
}

export function useDeleteOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => organizationService.deleteOrg(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ORG_KEYS.LIST })
      toast.success('Đã xóa tổ chức')
    },
    onError: () => toast.error('Xóa tổ chức thất bại'),
  })
}

// ── Classrooms ─────────────────────────────────────────────────────────────────

export function useClassroomList(orgId: string | undefined) {
  return useQuery({
    queryKey: [...ORG_KEYS.CLASSROOMS, orgId],
    queryFn: () => organizationService.listClassrooms(orgId!, { limit: 50 }),
    enabled: !!orgId,
  })
}

// ── Members ────────────────────────────────────────────────────────────────────

export function useMemberList(classroomId: string | undefined) {
  return useQuery({
    queryKey: [...ORG_KEYS.MEMBERS, classroomId],
    queryFn: () => organizationService.listMembers(classroomId!),
    enabled: !!classroomId,
  })
}

export function useRemoveMember(classroomId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => organizationService.removeMember(classroomId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...ORG_KEYS.MEMBERS, classroomId] })
      toast.success('Đã xóa thành viên')
    },
    onError: () => toast.error('Xóa thành viên thất bại'),
  })
}

// ── Report ─────────────────────────────────────────────────────────────────────

export function useClassroomReport(classroomId: string | undefined) {
  return useQuery({
    queryKey: [...ORG_KEYS.REPORT, classroomId],
    queryFn: () => organizationService.getClassroomReport(classroomId!),
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000,
  })
}
