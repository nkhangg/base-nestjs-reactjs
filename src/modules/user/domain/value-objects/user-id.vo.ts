import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  static create(): UserId {
    return new UserId({ value: randomUUID() });
  }

  static from(value: string): UserId {
    return new UserId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
