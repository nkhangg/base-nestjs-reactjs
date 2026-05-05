import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserActivatedEvent extends DomainEvent {
  readonly eventName = 'user.activated';

  constructor(public readonly userId: string) {
    super();
  }
}
