import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { FileUploadedEvent } from '../../../modules/media/domain/events/file-uploaded.event';
import { SendNotificationUseCase } from '../../../modules/notification/application/use-cases/send-notification.use-case';

@Injectable()
export class OnFileUploadedHandler {
  private readonly logger = new Logger(OnFileUploadedHandler.name);

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  @OnEvent('media.file_uploaded')
  async handle(event: FileUploadedEvent): Promise<void> {
    this.logger.log(`media.file_uploaded: ${event.filename} (${event.fileId})`);
    if (!event.uploadedBy) return;
    await this.sendNotification.execute({
      targets: [
        {
          kind: 'individual',
          recipientId: event.uploadedBy,
          recipientType: 'admin',
        },
      ],
      title: 'Upload thành công',
      body: `File "${event.filename}" đã được tải lên thành công`,
      type: 'success',
      senderType: 'system',
    });
  }
}
