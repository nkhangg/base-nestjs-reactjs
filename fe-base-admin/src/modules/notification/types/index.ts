export type NotificationType = 'system' | 'info' | 'warning' | 'alert' | 'success'

export interface RecipientSearchItem {
  id: string
  email: string
  isActive: boolean
}

export type RecipientType = 'user' | 'admin'

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

export interface SentNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  senderId: string | null
  senderType: 'admin' | 'system' | null
  senderEmail: string | null
  recipientSummary: { adminCount: number; userCount: number }
  createdAt: string
}

export interface SentNotificationDetail extends SentNotification {
  recipients: Array<{
    id: string
    recipientId: string
    recipientType: RecipientType
    isRead: boolean
    readAt: string | null
    createdAt: string
  }>
}

export type NotificationTarget =
  | { kind: 'individual'; recipientId: string; recipientType: RecipientType }
  | { kind: 'by-role'; roleName: string; subjectType: RecipientType }
  | { kind: 'all-users' }
  | { kind: 'all-admins' }
  | { kind: 'broadcast' }

export interface SendNotificationInput {
  title: string
  body: string
  type?: NotificationType
  targets: NotificationTarget[]
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

export interface PaginatedSentNotifications {
  data: SentNotification[]
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
