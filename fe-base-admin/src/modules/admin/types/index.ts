export interface CreateAdminDto {
  email: string
  password: string
  role?: string
}

export interface UpdateAdminRoleDto {
  role: string
}

export interface Admin {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface AdminListParams {
  page?: number
  limit?: number
  sortBy?: string
  search?: string
  'filter.isActive'?: string
  'filter.role'?: string
}

export interface AdminListMeta {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

export interface AdminListResponse {
  data: Admin[]
  meta: AdminListMeta
}

// ── Phase 3: Sessions & Auth Logs ─────────────────────────────────────────────

export interface AdminSession {
  id: string
  isActive: boolean
  isExpired: boolean
  deviceName: string
  ipAddress: string
  userAgent: string
  lastActiveAt: string
  expiresAt: string
  createdAt: string
}

export type AuthEventType = 'LOGIN' | 'LOGOUT' | 'EXPIRED'

export interface AuthLogEntry {
  sessionId: string
  event: AuthEventType
  deviceName: string
  ipAddress: string
  userAgent: string
  loginAt: string
  lastActiveAt: string
  expiresAt: string
}

export interface SessionListParams {
  page?: number
  limit?: number
  'filter.isActive'?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: AdminListMeta
}

// ── Phase 4: Role Management ──────────────────────────────────────────────────

export type SubjectType = 'admin' | 'user' | 'merchant' | '*'
export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'approve' | 'export'
export const ALL_ACTIONS: Action[] = ['create', 'read', 'update', 'delete', 'publish', 'approve', 'export']

export interface RolePermission {
  id: string
  resource: string
  actions: Action[]
}

export interface Role {
  id: string
  name: string
  subjectType: SubjectType
  description?: string
  parentId: string | null
}

export interface RoleDetail extends Role {
  permissions: RolePermission[]
}

export interface CreateRoleDto {
  name: string
  subjectType: SubjectType
  description?: string
  parentId?: string
  permissions: Record<string, Action[]>
}

export interface UpdateRoleDto {
  description?: string
  parentId?: string | null
  permissions?: Record<string, Action[]>
}
