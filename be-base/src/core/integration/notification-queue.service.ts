import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  NOTIFICATION_JOBS,
  type SendNotificationJobData,
} from '../queue/queue.constants';

@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly queue: Queue,
  ) {}

  async enqueue(data: SendNotificationJobData): Promise<void> {
    await this.queue.add(NOTIFICATION_JOBS.SEND, data);
  }
}
