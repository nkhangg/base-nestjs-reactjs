import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserDeactivatedEvent extends DomainEvent {
  readonly eventName = 'user.deactivated';

  constructor(public readonly userId: string) {
    super();
  }
}
