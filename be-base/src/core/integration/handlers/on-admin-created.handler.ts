import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { AdminCreatedEvent } from '../../../modules/admin/domain/events/admin-created.event';
import { NotificationQueueService } from '../notification-queue.service';

@Injectable()
export class OnAdminCreatedHandler {
  private readonly logger = new Logger(OnAdminCreatedHandler.name);

  constructor(private readonly notificationQueue: NotificationQueueService) {}

  @OnEvent('admin.created')
  async handle(event: AdminCreatedEvent): Promise<void> {
    this.logger.log(`admin.created: ${event.email} (${event.adminId})`);
    await this.notificationQueue.enqueue({
      targets: [
        {
          kind: 'by-permission',
          resource: 'system-notifications',
          action: 'read',
          subjectType: 'admin',
        },
      ],
      title: 'Admin mới được tạo',
      body: `${event.email} vừa được thêm vào hệ thống (role: ${event.role})`,
      type: 'info',
      senderType: 'system',
    });
  }
}
