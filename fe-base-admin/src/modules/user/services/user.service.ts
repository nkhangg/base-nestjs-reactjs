import { apiClient } from '@lib/api-client'
import type {
  User,
  UserListParams,
  UserListResponse,
  CreateUserDto,
  UpdateUserRoleDto,
  UpdateUserInfoDto,
} from '../types'

export const userService = {
  async listUsers(params?: UserListParams): Promise<UserListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & UserListResponse>(
      '/admin/users',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getUser(id: string): Promise<User> {
    const { data } = await apiClient.get<{ success: boolean; data: User }>(
      `/admin/users/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async createUser(dto: CreateUserDto): Promise<{ success: boolean; userId: string }> {
    const { data } = await apiClient.post('/admin/users', dto, { withCredentials: true })
    return data
  },

  async updateUserInfo(id: string, dto: UpdateUserInfoDto): Promise<void> {
    await apiClient.patch(`/admin/users/${id}`, dto, { withCredentials: true })
  },

  async updateUserRole(id: string, dto: UpdateUserRoleDto): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/role`, dto, { withCredentials: true })
  },

  async activateUser(id: string): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/activate`, {}, { withCredentials: true })
  },

  async deactivateUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`, { withCredentials: true })
  },
}
