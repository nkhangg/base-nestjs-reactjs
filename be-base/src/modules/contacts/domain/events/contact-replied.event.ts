import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ContactRepliedEvent extends DomainEvent {
  readonly eventName = 'contact.replied';

  constructor(
    public readonly payload: {
      contactId: string;
      customerEmail: string;
      customerFirstName: string;
      customerLastName: string;
      subject: string;
      replyMessage: string;
    },
  ) {
    super();
  }
}
