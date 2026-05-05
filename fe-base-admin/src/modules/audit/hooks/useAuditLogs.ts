import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { auditService } from '../services/audit.service'

export const AUDIT_LOGS_QUERY_KEY = ['audit-logs']

export function useAuditLogs(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => auditService.listAuditLogs(params),
    placeholderData: keepPreviousData,
  })
}
