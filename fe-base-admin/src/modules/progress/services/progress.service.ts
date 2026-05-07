import { apiClient } from '@lib/api-client'
import type { UserActivityResponse, LeaderboardResponse } from '../types'

export type LeaderboardPeriod = 'all-time' | 'weekly'

export const progressService = {
  async getUserActivityLogs(userId: string): Promise<UserActivityResponse> {
    const { data } = await apiClient.get<UserActivityResponse>(
      `/admin/progress/users/${userId}`,
      { withCredentials: true },
    )
    return data
  },

  async getLeaderboard(type: LeaderboardPeriod = 'all-time'): Promise<LeaderboardResponse> {
    const { data } = await apiClient.get<LeaderboardResponse>('/leaderboard', {
      params: { type },
      withCredentials: true,
    })
    return data
  },
}
