import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  MEDIA_FOLDER_REPOSITORY,
  type IMediaFolderRepository,
} from '../../domain/repositories/media-folder.repository';

@Injectable()
export class DeleteFolderUseCase {
  constructor(
    @Inject(MEDIA_FOLDER_REPOSITORY)
    private readonly folderRepo: IMediaFolderRepository,
  ) {}

  async execute(id: string): Promise<Result<void, string>> {
    const folder = await this.folderRepo.findById(id);
    if (!folder) return { ok: false, error: 'FOLDER_NOT_FOUND' };

    const hasChildren = await this.folderRepo.hasChildren(id);
    if (hasChildren) return { ok: false, error: 'FOLDER_HAS_SUBFOLDERS' };

    const hasFiles = await this.folderRepo.hasFiles(id);
    if (hasFiles) return { ok: false, error: 'FOLDER_HAS_FILES' };

    await this.folderRepo.delete(id);
    return { ok: true, value: undefined };
  }
}
