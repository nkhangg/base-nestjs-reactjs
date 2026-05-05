export interface AuditLog {
  id: string
  actorId: string
  actorEmail: string
  actorRole: string
  resource: string
  permission: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  ipAddress: string
  userAgent: string
  occurredAt: string
}

export interface AuditListMeta {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

export interface AuditListResponse {
  data: AuditLog[]
  meta: AuditListMeta
}
