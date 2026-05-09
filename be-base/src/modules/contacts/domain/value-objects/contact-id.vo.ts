import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ContactIdProps {
  value: string;
}

export class ContactId extends ValueObject<ContactIdProps> {
  static create(): ContactId {
    return new ContactId({ value: randomUUID() });
  }

  static from(value: string): ContactId {
    return new ContactId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
