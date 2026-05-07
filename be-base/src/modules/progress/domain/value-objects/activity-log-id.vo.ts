import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ActivityLogIdProps {
  value: string;
}

export class ActivityLogId extends ValueObject<ActivityLogIdProps> {
  static create(): ActivityLogId {
    return new ActivityLogId({ value: randomUUID() });
  }

  static from(value: string): ActivityLogId {
    return new ActivityLogId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
