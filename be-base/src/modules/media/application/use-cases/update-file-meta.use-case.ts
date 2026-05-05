import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { MediaScope } from '../../domain/entities/media-file.entity';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';

export interface UpdateFileMetaInput {
  id: string;
  filename?: string;
  alt?: string | null;
  tags?: string[];
  scope?: MediaScope;
  folderId?: string | null;
  updatedBy?: string;
}

@Injectable()
export class UpdateFileMetaUseCase {
  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
  ) {}

  async execute(input: UpdateFileMetaInput): Promise<Result<void, string>> {
    const file = await this.fileRepo.findById(input.id);
    if (!file) return { ok: false, error: 'FILE_NOT_FOUND' };

    file.updateMeta({
      filename: input.filename,
      alt: input.alt,
      tags: input.tags,
      scope: input.scope,
      folderId: input.folderId,
      updatedBy: input.updatedBy,
    });

    await this.fileRepo.save(file);
    return { ok: true, value: undefined };
  }
}
