import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface AdminIdProps {
  value: string;
}

export class AdminId extends ValueObject<AdminIdProps> {
  static create(): AdminId {
    return new AdminId({ value: randomUUID() });
  }

  static from(value: string): AdminId {
    return new AdminId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
