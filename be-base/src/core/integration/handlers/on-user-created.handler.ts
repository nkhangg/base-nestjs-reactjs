import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { UserCreatedEvent } from '../../../modules/user/domain/events/user-created.event';
import { NotificationQueueService } from '../notification-queue.service';

@Injectable()
export class OnUserCreatedHandler {
  private readonly logger = new Logger(OnUserCreatedHandler.name);

  constructor(private readonly notificationQueue: NotificationQueueService) {}

  @OnEvent('user.created')
  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`user.created: ${event.email} (${event.userId})`);
    await this.notificationQueue.enqueue({
      targets: [
        {
          kind: 'by-permission',
          resource: 'system-notifications',
          action: 'read',
          subjectType: 'admin',
        },
      ],
      title: 'Tài khoản mới đăng ký',
      body: `${event.email} vừa tạo tài khoản (role: ${event.role})`,
      type: 'info',
      senderType: 'system',
    });
  }
}
