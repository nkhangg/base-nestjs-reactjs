import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_EVENT_BUS, type IDomainEventBus } from '../../../../core/events';
import type { Result } from '../../../../shared/application/result';
import type { Contact } from '../../domain/entities/contact.entity';
import { ContactRepliedEvent } from '../../domain/events/contact-replied.event';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/repositories/contact.repository';

export interface ReplyToContactInput {
  id: string;
  replyMessage: string;
}

@Injectable()
export class ReplyToContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
    @Inject(DOMAIN_EVENT_BUS)
    private readonly events: IDomainEventBus,
  ) {}

  async execute(input: ReplyToContactInput): Promise<Result<Contact, 'NOT_FOUND'>> {
    const contact = await this.contactRepo.findById(input.id);
    if (!contact) return { ok: false, error: 'NOT_FOUND' };

    contact.reply(input.replyMessage);
    await this.contactRepo.save(contact);

    await this.events.publish(
      new ContactRepliedEvent({
        contactId: contact.id.value,
        customerEmail: contact.email,
        customerFirstName: contact.firstName,
        customerLastName: contact.lastName,
        subject: contact.subject,
        replyMessage: input.replyMessage,
      }),
    );

    return { ok: true, value: contact };
  }
}
