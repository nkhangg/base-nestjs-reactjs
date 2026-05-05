import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { FileUploadedEvent } from '../../../modules/media/domain/events/file-uploaded.event';
import { NotificationQueueService } from '../notification-queue.service';

@Injectable()
export class OnFileUploadedHandler {
  private readonly logger = new Logger(OnFileUploadedHandler.name);

  constructor(private readonly notificationQueue: NotificationQueueService) {}

  @OnEvent('media.file_uploaded')
  async handle(event: FileUploadedEvent): Promise<void> {
    this.logger.log(`media.file_uploaded: ${event.filename} (${event.fileId})`);
    if (!event.uploadedBy) return;
    await this.notificationQueue.enqueue({
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
