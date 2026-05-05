import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/repositories/notification.repository';
import {
  NOTIFICATION_RECIPIENT_REPOSITORY,
  type INotificationRecipientRepository,
} from '../../domain/repositories/notification-recipient.repository';
import type { Notification } from '../../domain/entities/notification.entity';
import type { NotificationRecipient } from '../../domain/entities/notification-recipient.entity';

export interface GetSentNotificationDetailOutput {
  notification: Notification | null;
  recipients: NotificationRecipient[];
}

@Injectable()
export class GetSentNotificationDetailUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
    @Inject(NOTIFICATION_RECIPIENT_REPOSITORY)
    private readonly recipientRepo: INotificationRecipientRepository,
  ) {}

  async execute(id: string): Promise<GetSentNotificationDetailOutput> {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) return { notification: null, recipients: [] };
    const recipients = await this.recipientRepo.findByNotificationId(id);
    return { notification, recipients };
  }
}
