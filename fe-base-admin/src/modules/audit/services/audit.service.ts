import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type { AuditListResponse } from '../types'

// DataTable date-range generates filter.occurredAt=$btw:from,to
// Backend expects filter.dateFrom=$eq:from & filter.dateTo=$eq:to
function transformDateRangeParam(params: NestjsPaginateParams): NestjsPaginateParams {
  const raw = params['filter.occurredAt'] as string | undefined
  if (!raw?.startsWith('$btw:')) return params

  const [from, to] = raw.slice(5).split(',')
  const result = { ...params }
  delete result['filter.occurredAt']
  if (from) result['filter.dateFrom'] = `$eq:${from}`
  if (to) result['filter.dateTo'] = `$eq:${to}`
  return result
}

export const auditService = {
  async listAuditLogs(params?: NestjsPaginateParams): Promise<AuditListResponse> {
    const transformed = params ? transformDateRangeParam(params) : undefined
    const { data } = await apiClient.get<AuditListResponse>('/admin/audit-logs', {
      params: transformed,
      withCredentials: true,
    })
    return { data: data.data, meta: data.meta }
  },
}
