import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type {
  AppConfig,
  ConfigListResponse,
  CreateConfigDto,
  UpdateConfigDto,
} from '../types'

export const configService = {
  async listConfigs(params?: NestjsPaginateParams): Promise<ConfigListResponse> {
    const { data } = await apiClient.get<ConfigListResponse>('/admin/configs', {
      params,
      withCredentials: true,
    })
    return { data: data.data, meta: data.meta }
  },

  async getConfig(id: string): Promise<AppConfig> {
    const { data } = await apiClient.get<{ success: boolean; data: AppConfig }>(
      `/admin/configs/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async createConfig(dto: CreateConfigDto): Promise<{ success: boolean; configId: string }> {
    const { data } = await apiClient.post('/admin/configs', dto, { withCredentials: true })
    return data
  },

  async updateConfig(id: string, dto: UpdateConfigDto): Promise<void> {
    await apiClient.patch(`/admin/configs/${id}`, dto, { withCredentials: true })
  },

  async toggleConfig(id: string): Promise<{ success: boolean; isEnabled: boolean }> {
    const { data } = await apiClient.patch(
      `/admin/configs/${id}/toggle`,
      {},
      { withCredentials: true },
    )
    return data
  },

  async deleteConfig(id: string): Promise<void> {
    await apiClient.delete(`/admin/configs/${id}`, { withCredentials: true })
  },

  async listPageConfigs(): Promise<AppConfig[]> {
    const { data } = await apiClient.get<ConfigListResponse>('/admin/configs', {
      params: { 'filter.key': '$sw:pages.', limit: 200 },
      withCredentials: true,
    })
    return data.data
  },
}
