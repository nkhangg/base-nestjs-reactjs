import { apiClient } from '@lib/api-client'
import type { PaginatedNotifications, UnreadCountResponse } from '../types'

export const notificationService = {
  getMyNotifications: (params?: {
    page?: number
    limit?: number
    isRead?: boolean
    search?: string
  }) =>
    apiClient
      .get<PaginatedNotifications>('/notifications', { params })
      .then((r) => r.data),

  getUnreadCount: () =>
    apiClient
      .get<{ success: boolean; data: UnreadCountResponse }>('/notifications/unread-count')
      .then((r) => r.data.data),

  markAsRead: (id: string) =>
    apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch<{ success: boolean }>('/notifications/read-all').then((r) => r.data),

  deleteNotification: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/notifications/${id}`).then((r) => r.data),
}
