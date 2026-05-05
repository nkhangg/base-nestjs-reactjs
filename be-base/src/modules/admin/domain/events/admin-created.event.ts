import { DomainEvent } from '../../../../shared/domain/domain-event';

export class AdminCreatedEvent extends DomainEvent {
  readonly eventName = 'admin.created';

  constructor(
    public readonly adminId: string,
    public readonly email: string,
    public readonly role: string,
  ) {
    super();
  }
}
