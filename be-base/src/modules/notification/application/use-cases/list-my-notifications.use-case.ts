import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/repositories/notification.repository';
import {
  NOTIFICATION_RECIPIENT_REPOSITORY,
  type INotificationRecipientRepository,
} from '../../domain/repositories/notification-recipient.repository';
import type { NotificationType } from '../../domain/entities/notification.entity';

export interface ListMyNotificationsInput {
  recipientId: string;
  recipientType: 'user' | 'admin';
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  search?: string;
}

export interface NotificationListItem {
  recipientId: string;
  notificationId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_RECIPIENT_REPOSITORY)
    private readonly recipientRepo: INotificationRecipientRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(
    input: ListMyNotificationsInput,
  ): Promise<{ data: NotificationListItem[]; total: number }> {
    const { data: recipients, total } =
      await this.recipientRepo.findByRecipient({
        recipientId: input.recipientId,
        recipientType: input.recipientType,
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        isRead: input.isRead,
        search: input.search,
      });

    const uniqueIds = [...new Set(recipients.map((r) => r.notificationId))];
    const notifications = await this.notificationRepo.findManyByIds(uniqueIds);
    const notifMap = new Map(notifications.map((n) => [n.id.value, n]));

    const data: NotificationListItem[] = recipients.map((r) => {
      const notif = notifMap.get(r.notificationId);
      return {
        recipientId: r.id.value,
        notificationId: r.notificationId,
        title: notif?.title ?? '',
        body: notif?.body ?? '',
        type: notif?.type ?? 'info',
        isRead: r.isRead,
        readAt: r.readAt,
        createdAt: r.createdAt,
      };
    });

    return { data, total };
  }
}
