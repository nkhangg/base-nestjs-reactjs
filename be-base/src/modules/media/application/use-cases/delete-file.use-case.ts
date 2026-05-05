import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';
import {
  STORAGE_PROVIDER,
  type IStorageProvider,
} from '../ports/storage.provider';

@Injectable()
export class DeleteFileUseCase {
  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async execute(id: string): Promise<Result<void, string>> {
    const file = await this.fileRepo.findById(id);
    if (!file) return { ok: false, error: 'FILE_NOT_FOUND' };

    await this.storage.delete(file.key);
    if (file.thumbnailKey) {
      await this.storage.delete(file.thumbnailKey).catch(() => undefined);
    }

    await this.fileRepo.delete(id);
    return { ok: true, value: undefined };
  }
}
