import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  MAIL_JOBS,
  type SendContactReplyJobData,
} from '../../queue/queue.constants';
import type { ContactRepliedEvent } from '../../../modules/contacts/domain/events/contact-replied.event';

@Injectable()
export class OnContactRepliedHandler {
  private readonly logger = new Logger(OnContactRepliedHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  @OnEvent('contact.replied')
  async handle(event: ContactRepliedEvent): Promise<void> {
    this.logger.log(
      `contact.replied: reply to ${event.payload.customerEmail} — "${event.payload.subject}"`,
    );

    const data: SendContactReplyJobData = {
      to: event.payload.customerEmail,
      firstName: event.payload.customerFirstName,
      lastName: event.payload.customerLastName,
      subject: event.payload.subject,
      replyMessage: event.payload.replyMessage,
    };

    await this.mailQueue.add(MAIL_JOBS.SEND_CONTACT_REPLY, data);

    this.logger.log(`Queued contact reply to ${event.payload.customerEmail}`);
  }
}
