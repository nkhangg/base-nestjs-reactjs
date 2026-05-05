import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface NotificationRecipientIdProps {
  value: string;
}

export class NotificationRecipientId extends ValueObject<NotificationRecipientIdProps> {
  static create(): NotificationRecipientId {
    return new NotificationRecipientId({ value: randomUUID() });
  }

  static from(value: string): NotificationRecipientId {
    return new NotificationRecipientId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
