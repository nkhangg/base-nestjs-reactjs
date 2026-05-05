import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserRoleChangedEvent extends DomainEvent {
  readonly eventName = 'user.role_changed';

  constructor(
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
  ) {
    super();
  }
}
