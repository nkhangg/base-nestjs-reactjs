import type {
  Notification as PrismaNotification,
  NotificationRecipient as PrismaNotificationRecipient,
} from '@prisma/client';
import {
  Notification,
  type NotificationType,
} from '../../domain/entities/notification.entity';
import {
  NotificationRecipient,
  type RecipientType,
} from '../../domain/entities/notification-recipient.entity';

export class NotificationMapper {
  static toDomain(raw: PrismaNotification): Notification {
    return Notification.reconstitute(raw.id, {
      type: raw.type as NotificationType,
      title: raw.title,
      body: raw.body,
      data: (raw.data as Record<string, unknown>) ?? null,
      senderId: raw.senderId,
      senderType: raw.senderType as 'admin' | 'system' | null,
      createdAt: raw.createdAt,
    });
  }

  static recipientToDomain(
    raw: PrismaNotificationRecipient,
  ): NotificationRecipient {
    return NotificationRecipient.reconstitute(raw.id, {
      notificationId: raw.notificationId,
      recipientId: raw.recipientId,
      recipientType: raw.recipientType as RecipientType,
      isRead: raw.isRead,
      readAt: raw.readAt,
      isDeleted: raw.isDeleted,
      deletedAt: raw.deletedAt,
      createdAt: raw.createdAt,
    });
  }
}
