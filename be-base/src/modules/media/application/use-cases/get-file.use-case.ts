import { Inject, Injectable } from '@nestjs/common';
import type { MediaFile } from '../../domain/entities/media-file.entity';
import type { Result } from '../../../../shared/application/result';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';

@Injectable()
export class GetFileUseCase {
  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
  ) {}

  async execute(id: string): Promise<Result<MediaFile, string>> {
    const file = await this.fileRepo.findById(id);
    if (!file) return { ok: false, error: 'FILE_NOT_FOUND' };
    return { ok: true, value: file };
  }
}
