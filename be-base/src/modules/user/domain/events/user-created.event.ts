import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserCreatedEvent extends DomainEvent {
  readonly eventName = 'user.created';

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
  ) {
    super();
  }
}
