import type { NotificationRecipient } from '../entities/notification-recipient.entity';

export const NOTIFICATION_RECIPIENT_REPOSITORY = Symbol(
  'NOTIFICATION_RECIPIENT_REPOSITORY',
);

export interface INotificationRecipientRepository {
  findById(id: string): Promise<NotificationRecipient | null>;
  findByNotificationId(
    notificationId: string,
  ): Promise<NotificationRecipient[]>;
  findByRecipient(params: {
    recipientId: string;
    recipientType: string;
    page: number;
    pageSize: number;
    isRead?: boolean;
    search?: string;
  }): Promise<{ data: NotificationRecipient[]; total: number }>;
  countUnread(recipientId: string, recipientType: string): Promise<number>;
  summarizeByNotificationIds(
    ids: string[],
  ): Promise<
    Array<{ notificationId: string; adminCount: number; userCount: number }>
  >;
  save(recipient: NotificationRecipient): Promise<void>;
  saveMany(recipients: NotificationRecipient[]): Promise<void>;
  markAllAsRead(recipientId: string, recipientType: string): Promise<void>;
}
