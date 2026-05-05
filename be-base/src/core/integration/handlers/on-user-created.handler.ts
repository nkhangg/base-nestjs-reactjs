import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { UserCreatedEvent } from '../../../modules/user/domain/events/user-created.event';
import { SendNotificationUseCase } from '../../../modules/notification/application/use-cases/send-notification.use-case';

@Injectable()
export class OnUserCreatedHandler {
  private readonly logger = new Logger(OnUserCreatedHandler.name);

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  @OnEvent('user.created')
  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`user.created: ${event.email} (${event.userId})`);
    await this.sendNotification.execute({
      targets: [{ kind: 'by-permission', resource: 'system-notifications', action: 'read', subjectType: 'admin' }],
      title: 'Tài khoản mới đăng ký',
      body: `${event.email} vừa tạo tài khoản (role: ${event.role})`,
      type: 'info',
      senderType: 'system',
    });
  }
}
