import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { AdminDeactivatedEvent } from '../../../modules/admin/domain/events/admin-deactivated.event';
import { SendNotificationUseCase } from '../../../modules/notification/application/use-cases/send-notification.use-case';

@Injectable()
export class OnAdminDeactivatedHandler {
  private readonly logger = new Logger(OnAdminDeactivatedHandler.name);

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  @OnEvent('admin.deactivated')
  async handle(event: AdminDeactivatedEvent): Promise<void> {
    this.logger.log(`admin.deactivated: ${event.adminId}`);
    await this.sendNotification.execute({
      targets: [
        { kind: 'by-permission', resource: 'system-notifications', action: 'read', subjectType: 'admin' },
      ],
      title: 'Admin bị vô hiệu hóa',
      body: `Tài khoản admin ID: ${event.adminId} vừa bị vô hiệu hóa`,
      type: 'warning',
      senderType: 'system',
    });
  }
}
