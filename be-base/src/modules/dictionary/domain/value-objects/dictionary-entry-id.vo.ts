import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface DictionaryEntryIdProps {
  value: string;
}

export class DictionaryEntryId extends ValueObject<DictionaryEntryIdProps> {
  static create(): DictionaryEntryId {
    return new DictionaryEntryId({ value: randomUUID() });
  }

  static from(value: string): DictionaryEntryId {
    return new DictionaryEntryId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
