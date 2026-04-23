import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/admin.service'

const sessionKey = (adminId: string) => ['admin-sessions', adminId]
const authLogsKey = (adminId: string) => ['admin-auth-logs', adminId]

export function useAdminSessions(adminId: string, onlyActive?: boolean) {
  return useQuery({
    queryKey: [...sessionKey(adminId), onlyActive],
    queryFn: () =>
      adminService.listSessions(adminId, {
        'filter.isActive': onlyActive === undefined ? undefined : String(onlyActive),
        limit: 50,
      }),
    enabled: !!adminId,
  })
}

export function useAdminAuthLogs(adminId: string) {
  return useQuery({
    queryKey: authLogsKey(adminId),
    queryFn: () => adminService.getAuthLogs(adminId, { limit: 50 }),
    enabled: !!adminId,
  })
}

export function useRevokeSession(adminId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => adminService.revokeSession(adminId, sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKey(adminId) }),
  })
}
