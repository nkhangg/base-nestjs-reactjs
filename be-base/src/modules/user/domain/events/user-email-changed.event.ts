import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserEmailChangedEvent extends DomainEvent {
  readonly eventName = 'user.email_changed';

  constructor(
    public readonly userId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
  ) {
    super();
  }
}
