import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface MediaFolderIdProps {
  value: string;
}

export class MediaFolderId extends ValueObject<MediaFolderIdProps> {
  static create(): MediaFolderId {
    return new MediaFolderId({ value: randomUUID() });
  }

  static from(value: string): MediaFolderId {
    return new MediaFolderId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
