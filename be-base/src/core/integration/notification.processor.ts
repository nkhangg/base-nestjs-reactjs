import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { NotificationTarget } from '../../modules/notification/application/services/notification-target-resolver.service';
import { SendNotificationUseCase } from '../../modules/notification/application/use-cases/send-notification.use-case';
import {
  QUEUE_NAMES,
  NOTIFICATION_JOBS,
  type SendNotificationJobData,
} from '../queue/queue.constants';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly sendNotification: SendNotificationUseCase) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(
      `Processing notification job: ${job.name} (id=${job.id}, attempt=${job.attemptsMade + 1})`,
    );

    switch (job.name) {
      case NOTIFICATION_JOBS.SEND: {
        const data = job.data as SendNotificationJobData;
        const result = await this.sendNotification.execute({
          title: data.title,
          body: data.body,
          type: data.type,
          data: data.data,
          targets: data.targets as unknown as NotificationTarget[],
          senderId: data.senderId,
          senderType: data.senderType,
        });
        this.logger.log(
          `Notification sent: id=${result.notificationId}, recipients=${result.recipientCount}`,
        );
        break;
      }
      default:
        this.logger.warn(`Unknown notification job name: ${job.name}`);
    }
  }
}
