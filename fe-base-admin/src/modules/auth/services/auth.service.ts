import { apiClient } from '@lib/api-client'
import type { CurrentUser, LoginDto } from '../types'

export const authService = {
  async login(dto: LoginDto): Promise<void> {
    await apiClient.post('/auth/login', dto, { withCredentials: true })
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {}, { withCredentials: true })
  },

  async getMe(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>('/auth/me', { withCredentials: true })
    return data
  },
}
