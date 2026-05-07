import { DomainEvent } from '../../../../shared/domain/domain-event';

export class DictionaryEntryApprovedEvent extends DomainEvent {
  readonly eventName = 'dictionary.entry_approved';

  constructor(
    public readonly entryId: string,
    public readonly hiragana: string,
    public readonly verifiedBy: string,
  ) {
    super();
  }
}
