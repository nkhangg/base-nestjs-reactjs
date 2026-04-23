import { apiClient } from '@lib/api-client'
import type {
  Admin,
  AdminListMeta,
  AdminListParams,
  AdminListResponse,
  AdminSession,
  AuthLogEntry,
  CreateAdminDto,
  CreateRoleDto,
  PaginatedResponse,
  Role,
  RoleDetail,
  SessionListParams,
  SubjectType,
  UpdateAdminRoleDto,
  UpdateRoleDto,
} from '../types'

export const adminService = {
  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  async listAdmins(params?: AdminListParams): Promise<AdminListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & AdminListResponse>(
      '/admin/management',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getAdmin(id: string): Promise<Admin> {
    const { data } = await apiClient.get<{ success: boolean; data: Admin }>(
      `/admin/management/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async createAdmin(dto: CreateAdminDto): Promise<{ success: boolean; adminId: string }> {
    const { data } = await apiClient.post('/admin/management', dto, { withCredentials: true })
    return data
  },

  async updateAdminRole(id: string, dto: UpdateAdminRoleDto): Promise<void> {
    await apiClient.patch(`/admin/management/${id}/role`, dto, { withCredentials: true })
  },

  async deactivateAdmin(id: string): Promise<void> {
    await apiClient.delete(`/admin/management/${id}`, { withCredentials: true })
  },

  // ── Sessions & Auth Logs ────────────────────────────────────────────────────

  async listSessions(
    adminId: string,
    params?: SessionListParams,
  ): Promise<PaginatedResponse<AdminSession>> {
    const { data } = await apiClient.get<{ success: boolean } & PaginatedResponse<AdminSession>>(
      `/admin/management/${adminId}/sessions`,
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getAuthLogs(
    adminId: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<AuthLogEntry>> {
    const { data } = await apiClient.get<{ success: boolean } & PaginatedResponse<AuthLogEntry>>(
      `/admin/management/${adminId}/sessions/auth-logs`,
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async revokeSession(adminId: string, sessionId: string): Promise<void> {
    await apiClient.delete(
      `/admin/management/${adminId}/sessions/${sessionId}`,
      { withCredentials: true },
    )
  },

  // ── Role CRUD ───────────────────────────────────────────────────────────────

  async listRoles(params?: {
    subjectType?: SubjectType
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: Role[]; meta: AdminListMeta }> {
    const { data } = await apiClient.get<{
      success: boolean
      data: Role[]
      meta: AdminListMeta
    }>('/admin/roles', { params, withCredentials: true })
    return { data: data.data, meta: data.meta }
  },

  async listRoleResources(): Promise<string[]> {
    const { data } = await apiClient.get<{ success: boolean; data: string[] }>(
      '/admin/roles/resources',
      { withCredentials: true },
    )
    return data.data
  },

  async getRole(id: string): Promise<RoleDetail> {
    const { data } = await apiClient.get<{ success: boolean; data: RoleDetail }>(
      `/admin/roles/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async createRole(dto: CreateRoleDto): Promise<{ roleId: string }> {
    const { data } = await apiClient.post<{ success: boolean; roleId: string }>(
      '/admin/roles',
      dto,
      { withCredentials: true },
    )
    return { roleId: data.roleId }
  },

  async updateRole(id: string, dto: UpdateRoleDto): Promise<void> {
    await apiClient.patch(`/admin/roles/${id}`, dto, { withCredentials: true })
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/admin/roles/${id}`, { withCredentials: true })
  },
}
