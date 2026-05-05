import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type {
  PaginatedNotifications,
  PaginatedSentNotifications,
  RecipientSearchItem,
  SendNotificationInput,
  SentNotificationDetail,
  UnreadCountResponse,
} from '../types'

export const notificationService = {
  searchRecipients: async (
    type: 'admin' | 'user',
    search?: string,
  ): Promise<RecipientSearchItem[]> => {
    const url = type === 'admin' ? '/admin/management' : '/admin/users'
    const { data } = await apiClient.get<{
      data: RecipientSearchItem[]
      meta: unknown
    }>(url, { params: { search, limit: 50 } })
    return data.data
  },

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
      .get<{ success: boolean; data: UnreadCountResponse }>('/admin/notifications/unread-count')
      .then((r) => r.data.data),

  markAsRead: (id: string) =>
    apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch<{ success: boolean }>('/notifications/read-all').then((r) => r.data),

  deleteNotification: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/notifications/${id}`).then((r) => r.data),

  sendNotification: (dto: SendNotificationInput) =>
    apiClient
      .post<{ success: boolean; data: { notificationId: string; recipientCount: number } }>(
        '/admin/notifications',
        dto,
      )
      .then((r) => r.data),

  getSentNotifications: (params?: NestjsPaginateParams | { page?: number; limit?: number }) =>
    apiClient
      .get<PaginatedSentNotifications>('/admin/notifications/sent', { params })
      .then((r) => r.data),

  getSentNotificationDetail: (id: string) =>
    apiClient
      .get<{ success: boolean; data: SentNotificationDetail }>(`/admin/notifications/sent/${id}`)
      .then((r) => r.data.data),
}
