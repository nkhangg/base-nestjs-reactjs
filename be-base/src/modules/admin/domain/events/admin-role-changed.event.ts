import { DomainEvent } from '../../../../shared/domain/domain-event';

export class AdminRoleChangedEvent extends DomainEvent {
  readonly eventName = 'admin.role_changed';

  constructor(
    public readonly adminId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
  ) {
    super();
  }
}
