import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { IMailerService } from './mail.interface';
import {
  QUEUE_NAMES,
  MAIL_JOBS,
  type SendPasswordResetJobData,
} from '../queue/queue.constants';

@Injectable()
export class MailQueueService implements IMailerService {
  constructor(
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  async sendPasswordResetEmail(params: {
    to: string;
    resetLink: string;
  }): Promise<void> {
    const data: SendPasswordResetJobData = {
      to: params.to,
      resetLink: params.resetLink,
    };
    await this.mailQueue.add(MAIL_JOBS.SEND_PASSWORD_RESET, data);
  }
}
