import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATION_RECIPIENT_REPOSITORY,
  type INotificationRecipientRepository,
} from '../../domain/repositories/notification-recipient.repository';
import type { Result } from '../../../../shared/application/result';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_RECIPIENT_REPOSITORY)
    private readonly recipientRepo: INotificationRecipientRepository,
  ) {}

  async execute(
    id: string,
    recipientId: string,
  ): Promise<Result<void, 'NOT_FOUND' | 'FORBIDDEN'>> {
    const recipient = await this.recipientRepo.findById(id);
    if (!recipient) return { ok: false, error: 'NOT_FOUND' };
    if (recipient.recipientId !== recipientId)
      return { ok: false, error: 'FORBIDDEN' };

    recipient.markAsRead();
    await this.recipientRepo.save(recipient);
    return { ok: true, value: undefined };
  }
}
