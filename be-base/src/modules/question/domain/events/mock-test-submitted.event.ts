import { DomainEvent } from '../../../../shared/domain/domain-event';

export class MockTestSubmittedEvent extends DomainEvent {
  readonly eventName = 'mock-test.submitted';

  constructor(
    public readonly userId: string | null,
    public readonly questionCount: number,
    public readonly correctCount: number,
    public readonly xp: number,
  ) {
    super();
  }
}
