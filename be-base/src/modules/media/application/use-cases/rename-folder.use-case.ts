import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  MEDIA_FOLDER_REPOSITORY,
  type IMediaFolderRepository,
} from '../../domain/repositories/media-folder.repository';

@Injectable()
export class RenameFolderUseCase {
  constructor(
    @Inject(MEDIA_FOLDER_REPOSITORY)
    private readonly folderRepo: IMediaFolderRepository,
  ) {}

  async execute(id: string, name: string): Promise<Result<void, string>> {
    const folder = await this.folderRepo.findById(id);
    if (!folder) return { ok: false, error: 'FOLDER_NOT_FOUND' };

    folder.rename(name);
    await this.folderRepo.save(folder);
    return { ok: true, value: undefined };
  }
}
