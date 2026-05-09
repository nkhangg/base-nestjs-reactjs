import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ContactSubmittedEvent extends DomainEvent {
  readonly eventName = 'contact.submitted';

  constructor(
    public readonly payload: {
      contactId: string;
      firstName: string;
      lastName: string;
      email: string;
      subject: string;
    },
  ) {
    super();
  }
}
