import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface NotificationIdProps {
  value: string;
}

export class NotificationId extends ValueObject<NotificationIdProps> {
  static create(): NotificationId {
    return new NotificationId({ value: randomUUID() });
  }

  static from(value: string): NotificationId {
    return new NotificationId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
