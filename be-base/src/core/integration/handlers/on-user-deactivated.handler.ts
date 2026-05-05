import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { UserDeactivatedEvent } from '../../../modules/user/domain/events/user-deactivated.event';
import { SendNotificationUseCase } from '../../../modules/notification/application/use-cases/send-notification.use-case';

@Injectable()
export class OnUserDeactivatedHandler {
  private readonly logger = new Logger(OnUserDeactivatedHandler.name);

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  @OnEvent('user.deactivated')
  async handle(event: UserDeactivatedEvent): Promise<void> {
    this.logger.log(`user.deactivated: ${event.userId}`);
    await this.sendNotification.execute({
      targets: [{ kind: 'by-permission', resource: 'system-notifications', action: 'read', subjectType: 'admin' }],
      title: 'Tài khoản bị khóa',
      body: `Tài khoản user ID: ${event.userId} vừa bị vô hiệu hóa`,
      type: 'warning',
      senderType: 'system',
    });
  }
}
