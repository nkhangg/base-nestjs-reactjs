export type NotificationType = 'system' | 'info' | 'warning' | 'alert' | 'success'

export interface NotificationRecipientItem {
  id: string
  notificationId: string
  title: string
  body: string
  type: NotificationType
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface UnreadCountResponse {
  count: number
}

export interface PaginatedMeta {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

export interface PaginatedNotifications {
  data: NotificationRecipientItem[]
  meta: PaginatedMeta
}

export interface SocketNotificationPayload {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  createdAt: string
}
