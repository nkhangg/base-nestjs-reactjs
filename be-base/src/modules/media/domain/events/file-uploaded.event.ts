import { DomainEvent } from '../../../../shared/domain/domain-event';

export class FileUploadedEvent extends DomainEvent {
  readonly eventName = 'media.file_uploaded';

  constructor(
    public readonly fileId: string,
    public readonly filename: string,
    public readonly uploadedBy: string | undefined,
  ) {
    super();
  }
}
