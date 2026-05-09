import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_EVENT_BUS, type IDomainEventBus } from '../../../../core/events';
import { Contact } from '../../domain/entities/contact.entity';
import { ContactSubmittedEvent } from '../../domain/events/contact-submitted.event';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/repositories/contact.repository';

export interface SubmitContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Injectable()
export class SubmitContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
    @Inject(DOMAIN_EVENT_BUS)
    private readonly events: IDomainEventBus,
  ) {}

  async execute(input: SubmitContactInput): Promise<{ contactId: string }> {
    const contact = Contact.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
    });

    await this.contactRepo.save(contact);

    await this.events.publish(
      new ContactSubmittedEvent({
        contactId: contact.id.value,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        subject: contact.subject,
      }),
    );

    return { contactId: contact.id.value };
  }
}
