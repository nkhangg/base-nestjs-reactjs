import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATION_RECIPIENT_REPOSITORY,
  type INotificationRecipientRepository,
} from '../../domain/repositories/notification-recipient.repository';

@Injectable()
export class MarkAllAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_RECIPIENT_REPOSITORY)
    private readonly recipientRepo: INotificationRecipientRepository,
  ) {}

  async execute(recipientId: string, recipientType: string): Promise<void> {
    await this.recipientRepo.markAllAsRead(recipientId, recipientType);
  }
}
