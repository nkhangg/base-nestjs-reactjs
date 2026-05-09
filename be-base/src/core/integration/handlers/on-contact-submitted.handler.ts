import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  QUEUE_NAMES,
  MAIL_JOBS,
  type SendContactNotificationJobData,
} from '../../queue/queue.constants';
import type { ContactSubmittedEvent } from '../../../modules/contacts/domain/events/contact-submitted.event';

@Injectable()
export class OnContactSubmittedHandler {
  private readonly logger = new Logger(OnContactSubmittedHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  @OnEvent('contact.submitted')
  async handle(event: ContactSubmittedEvent): Promise<void> {
    this.logger.log(
      `contact.submitted: ${event.payload.email} — "${event.payload.subject}"`,
    );

    const config = await this.prisma.appConfig.findUnique({
      where: { key: 'system.mails' },
    });

    if (!config || !config.isEnabled) return;

    let adminEmails: string[] = [];
    try {
      const raw = config.value;
      if (Array.isArray(raw)) {
        adminEmails = raw.filter((v): v is string => typeof v === 'string');
      }
    } catch {
      this.logger.warn('Failed to parse system.mails config value');
      return;
    }

    if (adminEmails.length === 0) return;

    await Promise.all(
      adminEmails.map((to) => {
        const data: SendContactNotificationJobData = {
          to,
          firstName: event.payload.firstName,
          lastName: event.payload.lastName,
          email: event.payload.email,
          subject: event.payload.subject,
        };
        return this.mailQueue.add(MAIL_JOBS.SEND_CONTACT_NOTIFICATION, data);
      }),
    );

    this.logger.log(
      `Queued contact notification to ${adminEmails.length} admin(s)`,
    );
  }
}
