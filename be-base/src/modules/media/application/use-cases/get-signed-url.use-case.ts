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
export class GetSignedUrlUseCase {
  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async execute(
    id: string,
    ttlSeconds = 3600,
  ): Promise<Result<{ signedUrl: string; expiresAt: Date }, string>> {
    const file = await this.fileRepo.findById(id);
    if (!file) return { ok: false, error: 'FILE_NOT_FOUND' };

    const signedUrl = await this.storage.getSignedUrl(file.key, ttlSeconds);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return { ok: true, value: { signedUrl, expiresAt } };
  }
}
