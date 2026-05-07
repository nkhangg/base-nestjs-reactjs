import { apiClient } from '@lib/api-client'
import type { DashboardStats, LearningModule } from '../types'

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats')
    return data
  },

  async getModules(): Promise<LearningModule[]> {
    const { data } = await apiClient.get<LearningModule[]>('/dashboard/modules')
    return data
  },
}
