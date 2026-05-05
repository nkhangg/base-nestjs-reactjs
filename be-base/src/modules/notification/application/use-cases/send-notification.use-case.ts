import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/repositories/notification.repository';
import {
  NOTIFICATION_RECIPIENT_REPOSITORY,
  type INotificationRecipientRepository,
} from '../../domain/repositories/notification-recipient.repository';
import {
  Notification,
  type NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationRecipient } from '../../domain/entities/notification-recipient.entity';
import {
  NotificationTargetResolverService,
  type NotificationTarget,
} from '../services/notification-target-resolver.service';
import {
  NOTIFICATION_EMITTER,
  type INotificationEmitter,
} from '../ports/notification-emitter.port';

export interface SendNotificationInput {
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  targets: NotificationTarget[];
  senderId?: string;
  senderType?: 'admin' | 'system';
}

export interface SendNotificationOutput {
  notificationId: string;
  recipientCount: number;
}

@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
    @Inject(NOTIFICATION_RECIPIENT_REPOSITORY)
    private readonly recipientRepo: INotificationRecipientRepository,
    private readonly targetResolver: NotificationTargetResolverService,
    @Inject(NOTIFICATION_EMITTER)
    private readonly emitter: INotificationEmitter,
  ) {}

  async execute(input: SendNotificationInput): Promise<SendNotificationOutput> {
    const notification = Notification.create({
      title: input.title,
      body: input.body,
      type: input.type ?? 'info',
      data: input.data,
      senderId: input.senderId,
      senderType: input.senderType ?? 'system',
    });

    await this.notificationRepo.save(notification);

    const resolved = await this.targetResolver.resolve(input.targets);

    const recipients = resolved.map((r) =>
      NotificationRecipient.create({
        notificationId: notification.id.value,
        recipientId: r.recipientId,
        recipientType: r.recipientType,
      }),
    );

    await this.recipientRepo.saveMany(recipients);

    const payload = {
      id: notification.id.value,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.createdAt,
    };

    for (const r of resolved) {
      this.emitter.emitToRecipient(r.recipientId, r.recipientType, payload);
    }

    return {
      notificationId: notification.id.value,
      recipientCount: recipients.length,
    };
  }
}
