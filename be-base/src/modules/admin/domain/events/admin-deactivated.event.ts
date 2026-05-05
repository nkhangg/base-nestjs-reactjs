import { DomainEvent } from '../../../../shared/domain/domain-event';

export class AdminDeactivatedEvent extends DomainEvent {
  readonly eventName = 'admin.deactivated';

  constructor(public readonly adminId: string) {
    super();
  }
}
