import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import sharp from 'sharp';
import {
  MediaFile,
  type MediaScope,
} from '../../domain/entities/media-file.entity';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';
import {
  STORAGE_PROVIDER,
  type IStorageProvider,
} from '../ports/storage.provider';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { FileUploadedEvent } from '../../domain/events/file-uploaded.event';

export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  scope?: MediaScope;
  folderId?: string;
  tags?: string[];
  createdBy?: string;
}

@Injectable()
export class UploadFileUseCase {
  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: UploadFileInput): Promise<MediaFile> {
    const ext = path.extname(input.originalname).toLowerCase();
    const uuid = crypto.randomUUID();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const key = `${year}/${month}/${uuid}${ext}`;

    const { url } = await this.storage.upload(
      key,
      input.buffer,
      input.mimetype,
    );

    let width: number | undefined;
    let height: number | undefined;
    let thumbnailKey: string | undefined;
    let thumbnailUrl: string | undefined;

    if (input.mimetype.startsWith('image/')) {
      try {
        const meta = await sharp(input.buffer).metadata();
        width = meta.width;
        height = meta.height;

        const thumbBuffer = await sharp(input.buffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
        const thumbKey = `${year}/${month}/${uuid}_thumb${ext}`;
        const thumbResult = await this.storage.upload(
          thumbKey,
          thumbBuffer,
          input.mimetype,
        );
        thumbnailKey = thumbResult.key;
        thumbnailUrl = thumbResult.url;
      } catch {
        // thumbnail generation failure is non-fatal
      }
    }

    const file = MediaFile.create({
      key,
      filename: input.originalname,
      mimeType: input.mimetype,
      size: input.size,
      url,
      width,
      height,
      thumbnailKey,
      thumbnailUrl,
      scope: input.scope,
      folderId: input.folderId,
      tags: input.tags,
      createdBy: input.createdBy,
    });

    await this.fileRepo.save(file);

    this.eventBus.publish(
      new FileUploadedEvent(file.id.value, file.filename, input.createdBy),
    );

    return file;
  }
}
