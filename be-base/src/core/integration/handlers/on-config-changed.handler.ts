import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { ConfigChangedEvent } from '../../../modules/config/domain/events/config-changed.event';
import { NotificationQueueService } from '../notification-queue.service';

@Injectable()
export class OnConfigChangedHandler {
  private readonly logger = new Logger(OnConfigChangedHandler.name);

  constructor(private readonly notificationQueue: NotificationQueueService) {}

  @OnEvent('config.changed')
  async handle(event: ConfigChangedEvent): Promise<void> {
    this.logger.log(`config.changed: ${event.key} (${event.configId})`);
    await this.notificationQueue.enqueue({
      targets: [
        {
          kind: 'by-permission',
          resource: 'system-notifications',
          action: 'read',
          subjectType: 'admin',
        },
      ],
      title: 'Cấu hình hệ thống thay đổi',
      body: `Config "${event.key}" đã được cập nhật${event.changedBy ? ` bởi ${event.changedBy}` : ''}`,
      type: 'warning',
      senderType: 'system',
    });
  }
}
