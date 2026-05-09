import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { NodemailerMailerService } from '../mail.service';
import {
  QUEUE_NAMES,
  MAIL_JOBS,
  type SendPasswordResetJobData,
  type SendContactNotificationJobData,
  type SendContactReplyJobData,
} from '../../queue/queue.constants';

@Processor(QUEUE_NAMES.MAIL)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: NodemailerMailerService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(
      `Processing mail job: ${job.name} (id=${job.id}, attempt=${job.attemptsMade + 1})`,
    );

    switch (job.name) {
      case MAIL_JOBS.SEND_PASSWORD_RESET: {
        const data = job.data as SendPasswordResetJobData;
        await this.mailerService.sendPasswordResetEmail({
          to: data.to,
          resetLink: data.resetLink,
        });
        this.logger.log(`Password reset email sent to ${data.to}`);
        break;
      }
      case MAIL_JOBS.SEND_CONTACT_NOTIFICATION: {
        const data = job.data as SendContactNotificationJobData;
        await this.mailerService.sendContactNotificationEmail({
          to: data.to,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          subject: data.subject,
        });
        this.logger.log(`Contact notification email sent to ${data.to}`);
        break;
      }
      case MAIL_JOBS.SEND_CONTACT_REPLY: {
        const data = job.data as SendContactReplyJobData;
        await this.mailerService.sendContactReplyEmail({
          to: data.to,
          firstName: data.firstName,
          lastName: data.lastName,
          subject: data.subject,
          replyMessage: data.replyMessage,
        });
        this.logger.log(`Contact reply email sent to ${data.to}`);
        break;
      }
      default:
        this.logger.warn(`Unknown mail job name: ${job.name}`);
    }
  }
}
