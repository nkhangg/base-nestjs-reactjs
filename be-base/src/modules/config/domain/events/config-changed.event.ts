import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ConfigChangedEvent extends DomainEvent {
  readonly eventName = 'config.changed';

  constructor(
    public readonly configId: string,
    public readonly key: string,
    public readonly oldValue: unknown,
    public readonly newValue: unknown,
    public readonly changedBy: string | undefined,
  ) {
    super();
  }
}
