import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { IMailerService } from './mail.interface';
import {
  QUEUE_NAMES,
  MAIL_JOBS,
  type SendPasswordResetJobData,
  type SendContactNotificationJobData,
  type SendContactReplyJobData,
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

  async sendContactNotificationEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
  }): Promise<void> {
    const data: SendContactNotificationJobData = {
      to: params.to,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      subject: params.subject,
    };
    await this.mailQueue.add(MAIL_JOBS.SEND_CONTACT_NOTIFICATION, data);
  }

  async sendContactReplyEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    subject: string;
    replyMessage: string;
  }): Promise<void> {
    const data: SendContactReplyJobData = {
      to: params.to,
      firstName: params.firstName,
      lastName: params.lastName,
      subject: params.subject,
      replyMessage: params.replyMessage,
    };
    await this.mailQueue.add(MAIL_JOBS.SEND_CONTACT_REPLY, data);
  }
}
