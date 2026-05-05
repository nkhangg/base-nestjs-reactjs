import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface MediaFileIdProps {
  value: string;
}

export class MediaFileId extends ValueObject<MediaFileIdProps> {
  static create(): MediaFileId {
    return new MediaFileId({ value: randomUUID() });
  }

  static from(value: string): MediaFileId {
    return new MediaFileId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
