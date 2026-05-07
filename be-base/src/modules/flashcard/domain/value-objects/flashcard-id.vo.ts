import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface FlashcardIdProps {
  value: string;
}

export class FlashcardId extends ValueObject<FlashcardIdProps> {
  static create(): FlashcardId {
    return new FlashcardId({ value: randomUUID() });
  }

  static from(value: string): FlashcardId {
    return new FlashcardId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
